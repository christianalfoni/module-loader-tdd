var assert = buster.assert,
    refute = buster.refute,
    p = modules._privates;
buster.testCase('module-loader', {
    setUp: function () {
        var moduleId = 0;
        this.createModule = function (name, func) {
            return {name: name || 'module' + moduleId++, func: func || function () {
                return {};
            }};
        }
    },
    'modules': {
        'is an object': function () {
            assert.isObject(modules);
        },
        'has method create()': function () {
            assert.isFunction(modules.create);
        },
        'has method initialize()': function () {
            assert.isFunction(modules.create);
        },
        'has method test()': function () {
            assert.isFunction(modules.create);
        }
    },
    'create()': {
        'throws error when passing wrong name argument': function () {
            assert.exception(modules.create, 'Passing no name');
            assert.exception(function () {
                modules.create({});
            }, 'passing wrong type');
        },
        'throws when passing wrong module argument': function () {
            assert.exception(modules.create, 'Passing no module');
            assert.exception(function () {
                modules.create('test', 'test');
            }, 'passing wrong type');
        }
    },
    'p.throw()': {
        'exists': function () {
            assert.isFunction(p.throw);
        },
        'takes on argument (message)': function () {
            assert.equals(p.throw.length, 1);
        }
    },
    'p.addModule()': {
        'exists': function () {
            assert.isFunction(p.addModule);
        },
        'takes three arguments (array, name, func)': function () {
            assert.equals(p.addModule.length, 3);
        },
        'adds a module object to the array with name and func': function () {
            var array = [],
                name = 'test',
                func = function () {
                };

            p.addModule(array, name, func);
            assert.equals(array[0], {name: name, func: func});

        }
    },
    'initialize()': {
        'takes on argument (callback)': function () {
            assert.equals(modules.initialize.length, 1);
        },
        'calls registerModules and the callback': function () {
            var spy = sinon.spy();
            sinon.stub(p, 'registerModules');
            modules.initialize(spy);
            assert(p.registerModules.calledOnce);
            assert(spy.calledOnce);
            p.registerModules.restore();
        }
    },
    'p.registerModules()': {
        tearDown: function () {
            modules.reset();
        },
        'exists': function () {
            assert.isFunction(p.registerModules);
        },
        'takes two arguments (defined, initialized)': function () {
            assert.equals(p.registerModules.length, 2);
        },
        'moves all defined modules to registered modules array': function () {
            var defined = [this.createModule(), this.createModule(), this.createModule()],
                registered = [];
            p.registerModules(defined, registered);
            assert.equals(defined.length, 0);
            assert.equals(registered.length, 3);

        },
        'initializes modules with missing deps after deps have been initialized': function () {
            var defined = [
                    this.createModule('2'),
                    this.createModule('1', function () {
                        this.require('2');
                        return {};
                    })
                ],
                initialized = [];
            p.registerModules(defined, initialized);
            assert.equals(defined.length, 0);
            assert.equals(initialized.length, 2);
            assert.equals(initialized[0].name, '2', 'dependency should be pushed first, even though it is initially processed last');
        },
        'throws error when module returns undefined': function () {
            var defined = [
                    this.createModule('1', function () {
                        return undefined;
                    })
                ],
                initialized = [];
            assert.exception(function () {
                p.registerModules(defined, initialized);
            });
        },
        'throws error when dependency does not exists': function () {
            var defined = [
                this.createModule('1', function () {
                    this.require('2');
                    return {};
                })
                ],
                initialized = [];
            assert.exception(function () {
                p.registerModules(defined, initialized);
            });
        }
    },
    'p.createContext()': {
        'exists': function () {
            assert.isFunction(p.createContext);
        },
        'takes one argument (modules)': function () {
            assert.equals(p.createContext.length, 1);
        },
        'returns object with a require method': function () {
            var returnedValue = p.createContext();
            assert.isObject(returnedValue);
            assert.isFunction(returnedValue.require);
            assert.isObject(returnedValue.privates);
        }
    },
    'p.getLast()': {
        'exists': function () {
            assert.isFunction(p.getLast);
        },
        'take one argument (modules)': function () {
            assert.equals(p.getLast.length, 1);
        },
        'returns the last item in the array': function () {
            var array = ['1', '2'];
            assert.equals(p.getLast(array), '2');
            assert.equals(array, ['1', '2'], 'array has not changed');
        }
    },
    'p.moveLastToFirst()': {
        'exists': function () {
            assert.isFunction(p.moveLastToFirst);
        },
        'takes one argument (modules)': function () {
            assert.equals(p.moveLastToFirst.length, 1);
        },
        'moves last item in array to the top': function () {
            var array = ['1', '2', '3'];
            p.moveLastToFirst(array)
            assert.equals(array, ['3', '1', '2']);
        }
    },
    'p.moveLastToTarget': {
        'exists': function () {
            assert.isFunction(p.moveLastToTarget);
        },
        'takes two arguments (sourceArray, targetArray': function () {
            assert.equals(p.moveLastToTarget.length, 2);
        },
        'moves last item in first array to second array': function () {
            var sourceArray = ['1', '2', '3'],
                targetArray = ['4'];
            p.moveLastToTarget(sourceArray, targetArray);
            assert.equals(sourceArray, ['1', '2']);
            assert.equals(targetArray, ['4', '3']);
        }
    },
    'p.getModule()': {
        'exists': function () {
            assert.isFunction(p.getModule);
        },
        'takes two arguments (name, modules)': function () {
            assert.equals(p.getModule.length, 2);
        },
        'throws exception when module does not exist': function () {
            assert.exception(function () {
                p.getModule('test', []);
            });
        },
        'returns module if it exists': function () {
            var modules = [
                {name: '1'},
                {name: '2'},
                {name: '3'}
            ];
            assert.equals(p.getModule('1', modules), {name: '1'});
            assert.equals(p.getModule('3', modules), {name: '3'});
        }
    },
    'test()': {
        tearDown: function () {
            modules.reset();
        },
        'exists': function () {
            assert.isFunction(modules.test);
        },
        'takes two arguments (name, callback)': function () {
            assert.equals(modules.test.length, 2);
        },
        'calls registerTestModule and callback': function () {
            var name = '1',
                callback = sinon.spy();
            sinon.stub(p, 'registerTestModule').returns({
                exports: {},
                privates: {},
                deps: {}
            });
            modules.test(name, callback);
            assert(p.registerTestModule.calledOnce);
            assert(callback.calledOnce);
            p.registerTestModule.restore();
        },
        'module to test is passed as argument to test callback': function () {
            var spy = sinon.spy();
            modules.create('1', function () {
                return {
                    myMethod: function () {}
                };
            });
            modules.test('1', spy);
            assert.isFunction(spy.getCall(0).args[0].myMethod);
        },
        'returns test even if dependency is loaded after test module': function () {
            var spy = sinon.spy();
            modules.create('2', function () { return {}; });
            modules.create('1', function () {
                this.require('2');
                return {
                    myMethod: function () {}
                };
            });
            modules.test('1', spy);
            assert.isFunction(spy.getCall(0).args[0].myMethod);
        },
        'returned test has access to privates and deps': function () {
            modules.create('2', function () {
                 return {
                    depMethod: function () {}
                }
            });
            modules.create('1', function () {
                var dep = this.require('2');
                this.privates = {
                    myPrivate: function () {}
                }
                return {};
            });
            modules.test('1', function (module, p, deps) {
                assert.isFunction(p.myPrivate);
                assert.isFunction(deps['2'].depMethod);
            });
        }
    },
    'p.registerTestModule()': {
        'exists': function () {
            assert.isFunction(p.registerTestModule);
        },
        'takes two arguments (name, defined)': function () {
            assert.equals(p.registerTestModule.length, 2);
        },
        'throws error when dependency does not exists': function () {
            var defined = [
                    this.createModule('1', function () {
                        this.require('2');
                        return {};
                    })
                ];
            assert.exception(function () {
                p.registerModules('1', defined);
            });
        }
    },
    'p.createTestContext()': {
        'exists': function () {
            assert.isFunction(p.createTestContext);
        },
        'takes one argument (modules)': function () {
            assert.equals(p.createTestContext.length, 1);
        }

    },
    'p.createTestRequireMethod()': {
        'exists': function () {
            assert.isFunction(p.createTestRequireMethod);
        },
        'takes two arguments (context, modules)': function () {
            assert.equals(p.createTestRequireMethod.length, 2);
        },
        'returns a function': function () {
            assert.isFunction(p.createTestRequireMethod({}, []));
        }
    },
    'p.stubDepExports()': {
        'exists': function () {
            assert.isFunction(p.stubDepExports);
        },
        'takes one argument (exports)': function () {
            assert(p.stubDepExports.length, 1);
        },
        'creates sinon stubs of all methods on exports object': function () {
            var exports = {
                func: function () {},
                func2: function () {}
            };
            p.stubDepExports(exports);
            assert.isFunction(exports.func.calledWith);
            assert.isFunction(exports.func2.calledWith);
        }
    },
    'p.timeout()': {
        'exists': function () {
            assert.isFunction(p.timeout);
        },
        'takes one argument (ms)': function () {
            assert.equals(p.timeout.length, 1);
        },
        'returns true if time passed is 100ms or more': function () {
            var exactLimit = new Date().getTime() - 100,
                passedLimit = new Date().getTime() - 200;
            assert(p.timeout(exactLimit));
            assert(p.timeout(passedLimit));
        },
        'returns false if time passed less than 100ms': function () {
            var time = new Date().getTime() - 50;
            buster.refute(p.timeout(time));
        }
    },
    'p.addDepException()': {
        'exists': function () {
            assert(p.addDepException);
        },
        'takes two arguments (array, message)': function () {
            assert.equals(p.addDepException.length, 2);
        },
        'adds message to array if not exists': function () {
            var array = [],
                message = 'test "name" test';
            p.addDepException(array, message);
            p.addDepException(array, message);
            assert.equals(array, ['name']);
        }
    },
    'p.getTemplate()': {
        'exists': function () {
            assert(p.getTemplate);
        }
    },
    'p.getTemplateByXhr()': {
        setUp: function () {
            this.fakeServer = sinon.fakeServer.create();
            this.fakeServer.autoRespond = true;
            this.fakeServer.respondWith('GET', 'templates/test.hbs',
                [200, { "Content-Type": "text/plain" },
                    '<div/>']);
        },
        'exists': function () {
            assert.isFunction(p.getTemplateByXhr);
        },
        'takes one argument (path)': function () {
            assert.equals(p.getTemplateByXhr.length, 1);
        },
        'returns a template function': function () {
            p.Handlebars = {
                compile: function () {
                    return function () {};
                }
            }
            assert.isFunction(p.getTemplateByXhr('test'));
            delete p.Handlebars;
        }
    },
    'p.extractBrowserArgs': {
        setUp: function () {
            this.createArgs = function () {
                return arguments;
            }
        },
        'exists': function () {
            assert(p.extractBrowserArgs);
        },
        'takes one argument (arguments)': function () {
            assert.equals(p.extractBrowserArgs.length, 1);
        },
        'returns an object of extracted arguments': function () {
            var func = function () {};
            assert.equals(p.extractBrowserArgs(this.createArgs()), {name: undefined, func: undefined});
            assert.equals(p.extractBrowserArgs(this.createArgs('module')), {name: 'module', func: undefined});
            assert.equals(p.extractBrowserArgs(this.createArgs('module', func)), {name: 'module', func: func});
        }
    },
    'p.extractNodeArgs': {
        setUp: function () {
            this.createArgs = function () {
                return arguments;
            }
        },
        'exists': function () {
            assert.isFunction(p.extractNodeArgs);
        },
        'takes one argument (arguments)': function () {
            assert.equals(p.extractNodeArgs.length, 1);
        },
        'returns an object of extracted arguments': function () {
            var func = function () {};
            assert.equals(p.extractNodeArgs(this.createArgs()), {name: '__node__', func: undefined});
            assert.equals(p.extractNodeArgs(this.createArgs('module')), {name: '__node__', func: 'module'});
            assert.equals(p.extractNodeArgs(this.createArgs(func)), {name: '__node__', func: func});
        }
    },
    'p.contextToArray': {
        'exists': function () {
            assert.isFunction(p.contextToArray);
        },
        'takes on argument (context)': function () {
            assert.equals(p.contextToArray.length, 1);
        },
        'returns a context array in the correct order': function () {
            var require = function () {},
                privates = {},
                requireTemplate = function () {};
            assert.equals(p.contextToArray({
                require: require,
                privates: privates,
                requireTemplate: requireTemplate
            }), [require, privates, requireTemplate]);
            assert.equals(p.contextToArray({
                privates: privates,
                requireTemplate: requireTemplate,
                require: require
            }), [require, privates, requireTemplate]);
            assert.equals(p.contextToArray({
                requireTemplate: requireTemplate,
                privates: privates,
                require: require
            }), [require, privates, requireTemplate]);
        }
    },
    'p.isModule': {
        'exists': function () {
            assert.isFunction(p.isModule);
        },
        'takes one argument (module)': function () {
            assert.equals(p.isModule.length, 1);
        },
        'returns true if the module is a module-loader module': function () {
            var moduleLoaderModule = new p.Module('hey', function () {});
            var otherModule = {
                aMethod: function () {}
            };
            assert(p.isModule(moduleLoaderModule));
            refute(p.isModule(otherModule));
        }
    }
});