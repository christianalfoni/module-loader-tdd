module-loader-tdd
=================

An easy to use and easy to test module loader. **EXPERIMENTAL VERSION**.

## Spec

### The basics
- Create closed modules that does not pollute the global scope
- A module can import other modules
- Module loading order is irrelevant. A dependency not yet loaded should postpone the initializing of the module
until the dependency has been initialized
- It supports concatinating all module files, compress and uglify wihtout breaking any code
- Give good error indications if you are using it wrong
- Freedom in naming modules (namespaces etc.)
- Short stack trace

### Additions
- A custom module context, giving access to setting private methods and deps that are only exposed during testing
- A "modules.test()" method which exposes private functions and deps. The deps are stubbed if using Sinon JS

## How to use it
You are required to load the scripts with script tags. They should be loaded in the body of your HTML so that any CSS
and/or HTML content can be displayed while loading the scripts.

**module-loader** exposes a global variable called: **modules**. It has three methods, *create*, *initialize* and 
*test*.

### Creating a module
Pass two arguments to the create method. A name for the module, which can contain any character, and a function.
```javascript
// FILE: logger.js
modules.create('logger', function () {
  'use strict';
  return {
    log: function (message) {
      console.log(message);
    }
  };
});
```
> **TIP:** Use namespace to divide your modules. E.g. **modules.create('helper.logger'...** or 
**modules.create('model.Todo'...**

### Adding dependencies
The first argument passed to your module function is *require*. Use it to fetch other modules defined. 
```javascript
// FILE: helloWorld.js
modules.create('helloWorld', function (require) {
  'use strict';
  var logger = require('logger');
  return {
    hello: function () {
      logger.log('Hello world!');
    }
  };
});
```
> Even if **myDep.js** is loaded after **myModule.js** it will still work.

### Creating private methods
The second argument passed is an object of private methods. These methods are not exposed normally, but will be
during testing of the module.
```javascript
// FILE: helloWorld.js
modules.create('helloWorld', function (require, p) {
  'use strict';
  var logger = require('logger');

  p.sayToWorld = function (say) {
      return say + ' world!';
  };
  
  return {
    hello: function () {
      logger.log(p.sayToWorld('Hello'));
    }
  };
});
```
**Why create these private methods?** When developing test-driven and functional, a core concept is creating small input-output
functions that are easily testable. In **module-loader** the context of a module has an object defined via
*this.privates*. You can register methods on this object. These are not available in the public interface returned
by the module, but will be available when testing the module.

The arugments passed to the module function is also available in the context. An alternative convention on defining
privates is by replacing the privates object, which has to be done via the context like this:
```javascript
modules.create('helloWorld', function (require) {
  'use strict';
  var logger = require('logger');

  var p = this.privates = { // The p variable is for conveniance
    sayToWorld: function (say) {
      return say + ' world!';
    }
  };
  
  return {
    hello: function () {
      logger.log(p.sayToWorld('Hello'));
    }
  };
});
```
### Initializing the project
```html
<!-- FILE: index.html -->
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <script src="lib/module-loader.js"></script>
    <script src="src/myModule.js"></script>
    <script src="src/myDep.js"></script>
    <script>
      modules.initialize(function (require) {
         var helloWorld = require('helloWorld');
         helloWorld.hello(); // -> Hello world!
      });
    </script>
  </body>
</html>
````
>**Note** that in production all the modules will be concatinated and optimized into one single javascript file, 
causing the browser to not do a lot of unecessary requests.

> **Note** that you could of course load a **main.js** as the last script instead of putting it inside your html
file/template

>**TIP:** When using Node JS and the HTML is delivered with a template, you can easily dynamically add the script
tags based on available .js files in your source folder.

### Testing a module
Running a test on a module requires you to pass the name of the module and a function for testing. The function
receives three arguments. The first being the returned value of the module, the second being the private methods
defined and the last being the required dependencies.

The deps object is a map of the dependencies, e.g. *deps.logger*. If the dependency is an object with methods
they are all automatically *stubbed*, which basically means that they are verifiable empty functions. We do this
to isolate the test to only the module and not trigger code that should be tested elsewhere.

```javascript
// FILE: helloWorld-test.js
modules.test('helloWorld', function (helloWorld, p, deps) {
  'use strict';
  buster.testCase('helloWorld test', {
    'hello()': {
      'is a function': function () {
        assert.isFunction(helloWorld.hello);
      },
      'calls dependency with message': function () {
        helloWorld.hello();
        // Deps are stubbed methods (Sinon JS), which lets us verify their usage
        // without actually executing the code
        assert(deps.logger.log.calledOnce); // Has the log method been called?
        assert(deps.logger.log.calledWith('Hello world!')); // Was it called with the expected message?
      }
    },
    'p.sayToWorld()': {
      'is a function': function () {
        assert.isFunction(p.sayToWorld);
      },
      'returns passed argument with " world!" appended to the string': function () {
        assert.equals(p.sayToWorld('Hello'), 'Hello world!');
        assert.equals(p.sayToWorld('Good evening'), 'Good evening world!');
      }
    }
  });
});
```
>**NOTE** that you can use any test library, but I recommend Buster JS because it is awesome and it includes Sinon JS
which is used to automatically stub dependencies of the module. A module test should only test the methods
within the module, not the dependencies as they will have their own tests.

## Why build it?

I have been working a lot with RequireJS and have a lot of good experience with it. When going
TDD though, I started having problems with test libraries, test related plugins and testing Node JS. A very typical 
search result on Google is: "How to make X work with requirejs". So I went into the specific details about why I 
was actually using RequireJS and identify through my experience what I really needed and if I could solve it myself.

#### The parts of RequireJS that does not really work for me
- RequireJS requires a lot of configuration in big projects and the configuration is duplicated when running multiple
applications against the same modules. The tests also needs a RequireJS configuration
- "How to make X work with requirejs" gives a feeling of "hacking" together parts of the project
- A lot of logic is running to load all the modules and "only load needed dependencies" does not really make sense
to me. When you load the project you normally want to load all the modules
- It is hard to test the modules. RequireJS modules gives a public interface, but the modules private functions and 
dependencies used makes them difficult to test
- All libraries are built for normal script loading, not all are built for RequireJS. Shimmed libraries are global, which
kinda breaks the concept
- The loading of files is based on directory structuring. You can overwrite with "paths", but that just adds
complexity
- It is very complex with lots of functionality
- Have not successfully accomplished code-coverage with it
- Stack trace is way too long, and does not make much sense

In RequireJS defense I am not using all the functionality and maybe the projects I work on would benefit more with
a different structure etc, but that also indicates its complexity.
