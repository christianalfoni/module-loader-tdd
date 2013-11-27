(function () {

    var isNode = typeof module !== 'undefined' && module.exports;
    var nodeRequire = isNode ? require : null;

    var globalObject = isNode ? global : window;
    var definedModules = [];
    var initializedModules = [];
    var isTest = false;
    var timeoutLimit = 100;

    var p = {
        Handlebars: typeof Handlebars !== 'undefined' ? Handlebars : null,
        Module: function Module (name, func) {
            this.name = name;
            this.func = func;
        },
        isModule: function (module) {
            return module instanceof p.Module;
        },
        'throw': function (message) {
            throw Error('MODULE-LOADER-TDD(): ' + message);
        },
        getModule: function (name, modules) {
            var module;
            for (var x = 0; x < modules.length; x++) {
                if (modules[x].name === name) {
                    module = modules[x];
                    break;
                }
            }
            if (isNode && !module) {
                return p.nodeRequire(name, modules);
            } else if (!module) p.throw('Could not require module: "' + name + '". It might be because it does not exist or you have caused a loop.');
            return module;
        },
        addModule: function (array, name, func) {
            array.push(new p.Module(name, func));
        },
        registerModules: function (defined, initialized) {
            var module,
                context,
                initializeModule = true,
                startTime = new Date().getTime(),
                depExceptions = [];
            while (defined.length && !p.timeout(startTime)) {
                initializeModule = true;
                module = p.getLast(defined);
                context = p.createContext(initialized);
                try {
                    context.exports = module.func.apply(context, [context.require, context.privates, context.requireTemplate]);
                } catch (e) {
                    // Dependency not ready
                    if (e.message.match(/MODULE-LOADER/)) {
                        p.addDepException(depExceptions, e.message);
                        p.moveLastToFirst(defined);
                        initializeModule = false;
                    } else {
                        throw e;
                    }
                }
                if (initializeModule && typeof context.exports === 'undefined') {
                    p.throw('Module ' + module.name + ' is returning undefined, it has to return something');
                }
                if (initializeModule) {
                    module.exports = context.exports;
                    p.moveLastToTarget(defined, initialized);
                }
            }

            if (p.timeout(startTime)) {
                p.throw('Timeout, could not load modules. The following dependencies gave errors: ' +
                    (depExceptions.length ? depExceptions.join(', ') : name) +
                    '. They do not exist or has caused a loop.');
            }
        },
        contextToArray: function (context) {
            return [context.require, context.privates, context.requireTemplate];
        },
        registerTestModule: function (name, defined) {
            var module,
                context,
                testModule,
                startTime = new Date().getTime(),
                depExceptions = [];
            while (!testModule && !p.timeout(startTime)) {
                module = p.getLast(defined);
                context = p.createTestContext(defined);
                if (module.name === name) {
                    try {
                        context.exports = module.func.apply(context, p.contextToArray(context));
                    } catch (e) {
                        if (e.message.match(/MODULE-depsExceptions/)) {
                            p.addDepException(depExceptions, e.message);
                            p.moveLastToFirst(defined);
                        } else {
                            throw e;
                        }
                    }
                    testModule = module;
                }
            }
            if (p.timeout(startTime)) {
                p.throw('Timeout, could not load modules. The following dependencies gave errors: ' +
                    (depExceptions.length ? depExceptions.join(', ') : name) +
                    '. They do not exist or has caused a loop.');
            }
            if (!context.exports) {
                p.throw('Module ' + testModule.name + ' is returning undefined, it has to return something');
            }

            return context;

        },
        timeout: function (startTime) {
            return new Date().getTime() - startTime >= timeoutLimit;
        },
        addDepException: function (array, message) {
            message = message.match(/\"(.*)\"/)[1];
            if (array.indexOf(message) === -1) {
                array.push(message);
            }
        },
        hasUnregisteredModule: function (array) {
            for (var x = array.length - 1; x >= 0; x--) {
                if (array[x].name === '__node__') {
                    return array[x];
                }
            }
        },
        nodeRequire: function (name, modules) {
            var module = nodeRequire(name);
            var unregisteredModule = p.hasUnregisteredModule(definedModules);
            if (unregisteredModule) { // Require added new module?
                unregisteredModule.name = name;
                if (!isTest)  {
                    p.registerModules(definedModules, initializedModules);
                    return p.getModule(name, modules).exports;
                } else {
                    return p.getModule(name, modules);
                }

            } else {
                return module;
            }
        },
        createContext: function (modules) {
            var context = {
                privates: {},
                require: function (name) {
                    var module = p.getModule(name, modules);
                    return p.isModule(module) ? module.exports : module; // Return exports only if it is a module-loader module
                }
            }
            if (!isNode && p.Handlebars) { // Only give access to requireTemplate if in browser and Handlebars is available
                context.requireTemplate = p.getTemplate;
            } else if (!isNode) {
                context.requireTemplate = function () {
                    p.throw('Unable to fetch template. Can not find Handlebars in the global scope, is it loaded?');
                }
            }
            return context;
        },
        createTestContext: function (modules) {
            var context = {
                privates: {},
                deps: {}
            };
            context.require = p.createTestRequireMethod(context, modules);
            if (!isNode && p.Handlebars) {
                context.requireTemplate = p.getTemplate;
            } else if (!isNode) {
                context.requireTemplate = function () {
                    p.throw('Unable to fetch template. Can not find Handlebars in the global scope, is it loaded?');
                }
            }
            return context;
        },
        createTestRequireMethod: function (context, modules) {
            return function (name) {
                var depModule = p.getModule(name, modules),
                    depContext = {
                        require: function () {}, // Do not require any deeper dependencies
                        privates: {}
                    };
                if (!isNode && p.Handlebars) {
                    depContext.requireTemplate = function () {} // Do not require any templates inside dependencies
                }
                depContext.exports = p.isModule(depModule) ? depModule.func.apply(depContext, p.contextToArray(depContext)) : depModule;
                // Make exports available on the module
                depModule.exports = depContext.exports;
                // Adds the dependency exports to the main context
                // which lets you edit the stubs in the test
                context.deps[name] = depContext.exports;
                p.stubDepExports(depModule.exports);
                return depModule.exports;
            }
        },
        stubDepExports: function (exports) {
            var sinonTest = typeof sinon === 'undefined' && isNode ? nodeRequire('sinon') : sinon;
            if (sinonTest) {
                for (var depMethod in exports) {
                    if (typeof exports[depMethod] === 'function') {
                        sinonTest.stub(exports, depMethod);
                    }
                }
            }
        },
        getTemplate: function (path) {
            if (p.Handlebars.Templates && p.Handlebars.Templates[path]) {
                return p.Handlebars.Templates[path];
            } else {
                return p.getTemplateByXhr(path);
            }
        },
        getTemplateByXhr: function (path) {
            var xhr = new XMLHttpRequest();
            path = (window.modules.templatesPath || 'templates/') + path + '.hbs';
            xhr.open('GET', path, false);
            xhr.send(null);
            if (xhr.status === 200) {
                return p.Handlebars.compile(xhr.responseText);
            } else {
                p.throw('Could not download requested template at: ' + path + ' , it probably does not exist, check the name');
            }
        },
        getLast: function (modules) {
            return modules[modules.length - 1];
        },
        moveLastToFirst: function (modules) {
            modules.unshift(modules.pop());
        },
        moveLastToTarget: function (sourceArray, targetArray) {
            targetArray.push(sourceArray.pop());
        },
        extractBrowserArgs: function (args) {
            return {
                name: args[0],
                func: args[1]
            }
        },
        extractNodeArgs: function (args) {
            return {
                name: '__node__', // A temporary name to identify any new modules created when requiring
                func: args[0]
            }
        },
        requireTestModule: function (name, modules) {
            // When node requires a module it is instantly registered
            // to definedModules where it will get a temp name, __node__.
            // The name is then changed to the actual required name
            nodeRequire(name);
            if (modules.length) {
                modules[0].name = name;
            } else {
                p.throw('Module required for testing is not a module-loader module!');
            }
        }
    };

    var modules = {
        _privates: p,
        create: function () {
            var args;
            if (isNode) {
                args = p.extractNodeArgs(arguments);
            } else {
                args = p.extractBrowserArgs(arguments);
            }
            if (!args.name || typeof args.name !== 'string' || !args.func || typeof args.func !== 'function') {
                p.throw('Invalid arguments for module creation, you have to pass a string and a function, or just a function if running in Node');
            }
            p.addModule(definedModules, args.name, args.func);
        },
        initialize: function (callback) {
            p.registerModules(definedModules, initializedModules);
            var context = p.createContext(initializedModules);
            callback.apply(context, p.contextToArray(context));
        },
        test: function (name, callback) {
            isTest = true;
            if (isNode) {
                p.requireTestModule(name, definedModules);
            }
            var context = p.registerTestModule(name, definedModules);
            callback.apply(context, [context.exports, context.privates, context.deps]);
        },
        reset: function () {
            initializedModules = [];
            definedModules = [];
        }
    };

    if (isNode) {
        module.require = function () {
            p.throw('You are not using the require function passed to the module, insert the require argument');
        };
        globalObject.modules = modules;
        module.exports = modules;
    } else {
        globalObject.modules = modules;
    }
}());