(function () {

    /**
     * VERSION 2.0.2
     */

    var isNode = typeof module !== 'undefined' && module.exports;
    var isLoaded = false;
    var globalObject = isNode ? global : window;
    var definedModules = [];
    var initializedModules = [];
    var isTest = false;
    var nodeRequire = isNode ? module.require : null;
    var nodeModule = isNode ? module : null;
    var globalTemplates = 'Templates';
    var tempDepExceptions = [];
    var resourceHandler = null;
    var emitter = null;

    var p = {
        Handlebars: typeof Handlebars !== 'undefined' ? Handlebars : null,
        Module: function Module(name, func) {
            this.name = name;
            this.func = func;
        },
        isModule: function (module) {
            return module instanceof p.Module;
        },
        'throw': function (message) {
            throw Error('MODULE-LOADER-TDD(): ' + message);
        },
        getSinon: function () {
            return isNode ? require('sinon') : globalObject.sinon;
        },
        createResourceHandler: function (ignoreRegister) {

            var resourceCallbacks = {};

            return {
                register: function (type, callback) {

                    // Do not register resource handling when testing
                    if (ignoreRegister) {
                        return;
                    }

                    resourceCallbacks[type] = function () {
                        return callback.apply(globalObject, event.detail.value);
                    };

                },
                fetch: function (type) {

                    var resource = resourceCallbacks[type];

                    if (!resource) {
                        p.throw('Resource Error: "' + type + '" is not a valid resource');
                    }

                    return resource.apply(window, Array.prototype.slice.call(arguments, 0).splice(1, arguments.length))


                },
                remove: function (name) {
                    if (resourceCallbacks[name]) {
                        delete resourceCallbacks[name];
                    } else {
                        p.throw('Resource Error: Can not remove ' + name + ', it does not exist');
                    }
                },
                teardown: function () {
                    for (var callback in resourceCallbacks) {
                        delete resourceCallbacks[callback];
                    }
                }
            }

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
            } else if (!module) p.throw('Could not require module: "' + name + '". It might be because the script is not loaded, the name does not exist or you have caused a loop.');
            return module;
        },
        addModule: function (array, name, func) {
            array.push(new p.Module(name, func));
        },
        registerModules: function (defined, initialized) {
            var module,
                context,
                initializeModule = true,
                depExceptions = [];
            while (defined.length) {
                initializeModule = true;
                module = p.getLast(defined);
                context = p.createContext(initialized);
                try {
                    context.exports = module.func.apply(context, p.contextToArray(context));
                } catch (e) {
                    // Dependency not ready
                    if (e.message.match(/MODULE-LOADER/)) {
                        p.addDepException(depExceptions, e.message);
                        p.moveLastToFirst(defined);
                        initializeModule = false;
                    } else {
                        throw e;
                    }

                    if (depExceptions.length) {
                        p.throw('The following ' + depExceptions[0].type.toUpperCase() + ' gave errors: ' + depExceptions[0].name +
                            '. It does not exist ' + (depExceptions[0].type === 'module' ? 'or has caused a loop.' : ''));
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

        },
        contextToArray: function (context) {
            return [context.require, context.privates, context.resource];
        },
        registerTestModule: function (name, defined) {
            var module,
                context,
                testModule,
                depExceptions = [];
            while (!testModule) {
                module = p.getLast(defined);
                context = p.createTestContext(defined);
                if (module.name === name) {
                    try {
                        context.exports = module.func.apply(context, p.contextToArray(context));
                    } catch (e) {
                        if (e.message.match(/MODULE-LOADER/)) {
                            p.addDepException(depExceptions, e.message);
                            p.moveLastToFirst(defined);
                        } else {
                            throw e;
                        }

                        if (depExceptions.length) {
                            p.throw('The following ' + depExceptions[0].type.toUpperCase + ' gave errors: ' + depExceptions[0].name +
                                '. It does not exist ' + (depExceptions[0].type === 'module' ? 'or has caused a loop.' : ''));
                        }
                    }
                    testModule = module;
                } else {
                    p.moveLastToFirst(defined);
                }
            }

            if (!context.exports && !depExceptions.length) {
                p.throw('Module ' + testModule.name + ' is returning undefined, it has to return something');
            }

            return context;

        },
        addDepException: function (array, message) {

            var name = message.match(/\"(.*)\"/)[1],
                type = message.match(/Resource/) ? 'resource' : 'module';

            // If exception has not been registerede yet, add it to temp
            if (tempDepExceptions.indexOf(name + '_' + type) === -1) {
                tempDepExceptions.push(name + '_' + type);
            } else {
                // If registered before, it is going in a loop, add as exception
                array.push({
                    type: type,
                    name: name
                });
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
            var module = nodeRequire.call(nodeModule, name);

            var unregisteredModule = p.hasUnregisteredModule(definedModules);
            if (unregisteredModule) { // Require added new module?
                unregisteredModule.name = name;
                if (!isTest) {
                    p.registerModules(definedModules, initializedModules);
                    return p.getModule(name, modules).exports;
                } else {
                    return p.getModule(name, modules);
                }

            } else {
                return module;
            }
        },
        getModulePath: function (name) {
            if (name.substr(0, 1) === '.') {
                var path = nodeRequire.call(nodeModule, 'path'),
                    callsite = nodeRequire.call(nodeModule, 'callsite'),
                    stack = callsite(),
                    requester = stack[2].getFileName();
                name = path.dirname(requester) + name.substr(1);
            }
            return name;
        },
        createContext: function (modules) {
            var context = {
                privates: {},
                require: function (name) {
                    if (isNode) {
                        name = p.getModulePath(name);
                    }
                    var module = p.getModule(name, modules);
                    return p.isModule(module) ? module.exports : module; // Return exports only if it is a module-loader module
                },
                resource: resourceHandler
            };
            if (!isNode && p.Handlebars) { // Only give access to requireTemplate if in browser and Handlebars is available
                context.require.template = p.getTemplate;
            } else if (!isNode) {
                context.require.template = function () {
                    p.throw('Unable to fetch template. Can not find Handlebars in the global scope, is it loaded? Be sure to load module-loader-tdd after any other libs');
                }
            }
            return context;
        },
        createTestContext: function (modules) {
            var context = {
                privates: {},
                deps: {},
                resource: resourceHandler
            };
            context.require = p.createTestRequireMethod(context, modules);
            if (!isNode) {
                context.require.template = function () {
                    return function () {
                        return '';
                    }
                } // Do not require any templates
            }

            return context;
        },
        createTestRequireMethod: function (context, modules) {
            return function (name) {
                var depExceptions = [];
                if (isNode) {
                    name = p.getModulePath(name);
                }
                var depModule = p.getModule(name, modules),
                    depContext = {
                        privates: {},
                        require: function (name) { // TODO: Make this more general with registerModule

                            if (isNode) {
                                name = p.getModulePath(name);
                            }
                            var module = p.getModule(name, modules);

                            try {
                                module = module.func.apply(context, p.contextToArray(context));
                            } catch (e) {
                                if (e.message.match(/MODULE-LOADER/)) {
                                    p.addDepException(depExceptions, e.message);
                                } else {
                                    throw e;
                                }
                            }

                            return p.isModule(module) ? module.exports : module; // Return exports only if it is a module-loader module

                        }
                    };

                if (!isNode && p.Handlebars) {
                    depContext.require.template = function () {
                        return function () {
                            return '';
                        }
                    } // Do not require any templates inside dependencies
                }

                depContext.exports = p.isModule(depModule) ? depModule.func.apply(depContext, p.contextToArray(depContext)) : depModule;

                // Adds the dependency exports to the main context
                // which lets you edit the stubs in the test
                depModule.exports = p.stubDepExports(depContext.exports);
                context.deps[name] = depModule.exports;

                return depModule.exports;
            }
        },
        stubDepExports: function (exports) {
            var sinon = p.getSinon();
            if (sinon) {
                var stubbedMethods = {};

                if (typeof exports === 'function') {
                    return sinon.spy();
                } else {
                    for (var depMethod in exports) {
                        if (typeof exports[depMethod] === 'function') {
                            stubbedMethods[depMethod] = exports[depMethod];
                            sinon.stub(stubbedMethods, depMethod);
                        }
                    }
                }

                return stubbedMethods;
            }
            return exports;
        },
        getTemplate: function (path) {
            if (!p.Handlebars) {
                return p.throw('Handlebars is not loaded, please load Handlebars before loading module-loader-tdd');
            }
            if (globalObject[globalTemplates] && globalObject[globalTemplates][path]) {
                return globalObject[globalTemplates][path];
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
        parseTemplatesPath: function (path) {
            if (path.substr(0, 1) === '/') {
                path = path.slice(1, path.length);
            }
            if (path.substr(path.length - 1, 1) !== '/') {
                path += '/';
            }
            return path;
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

            var init = function () {

                if (!isNode) {
                    document.removeEventListener("DOMContentLoaded", init);
                    document.removeEventListener("deviceready", init)
                }
                p.registerModules(definedModules, initializedModules);
                var context = p.createContext(initializedModules);
                callback.apply(context, p.contextToArray(context));
            }

            if (this.templatesPath) {
                this.templatesPath = p.parseTemplatesPath(this.templatesPath);
            }
            if (this.templates) {
                globalTemplates = this.templates;
            }

            resourceHandler = p.createResourceHandler();

            if (isNode) {
                init();
            } else {
                document.addEventListener("DOMContentLoaded", init);
                document.addEventListener("deviceready", init);
            }

        },
        test: function (name, callback) {
            isTest = true;
            resourceHandler = p.createResourceHandler(true); // To prevent modules from registering resource
            if (isNode) {
                name = p.getModulePath(name); // Have to get the name on first call to module-loader method
                p.getModule(name, definedModules);
            }
            var context = p.registerTestModule(name, definedModules);
            callback.apply(context, [context.exports, context.privates, context.deps, p.createResourceHandler(false)]);
        },
        reset: function () {
            initializedModules = [];
            definedModules = [];
        }
    };

    if (isNode) {
        emitter = require('events').EventEmitter;
        emitter = new emitter();
        globalObject.modules = modules;
        module.exports = modules;
    } else {
        globalObject.modules = modules;
    }
}());