module-loader-tdd
=================
An easy to use and easy to test module loader. **EXPERIMENTAL VERSION**.
### Table of contents
- [Demo](#demo)
- [Install](#install)
- [The spec](#spec)
- [Creating a module](#creating)
- [Adding dependencies](#deps)
- [Templates](#templates)
- [Adding private methods](#privates)
- [Initializing](#init)
- [Testing a module](#testing)
- [Node: Creating a module](#creating_node)
- [Node: Initializing](#init_node)
- [Node: Testing a module](#testing_node)
- [Why build it?](#why)

<a name="demo"/>
## Demo
Have a look at the demo over at: https://github.com/christianalfoni/module-loader-tdd-demo . It shows a complete project setup with client, server and Buster JS.

<a name="install"/>
## Install
- **Browser**: Download the file from lib folder
- **Node**: npm install module-loader-tdd

<a name="spec"/>
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
- Supports Node JS
- Supports HTML templates

### Test additions
- Close the module completely, no code execution beyond the tested module
- A custom module context, giving access to setting private methods and deps that are only exposed during testing
- A "modules.test()" method which exposes private functions and deps. The deps are stubbed causing the module
to be completely unaffected by other parts of the project

## How to use it in the browser
You are required to load the scripts with script tags. They should be loaded in the body of your HTML so that any CSS
and/or HTML content can be displayed while loading the scripts.

**module-loader** exposes a global variable called: **modules**. It has three methods, *create*, *initialize* and 
*test*.
<a name="creating"/>
### Creating a module
Pass two arguments to the create method. A name for the module, which can contain any character, and a function. 
The returned value from the function will be available to other modules.
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

<a name="deps"/>
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
> Even if **helloWorld.js** is loaded after **logger.js** it will still work.

<a name="privates"/>
### Creating private methods
The second argument passed is an object of private methods. These methods are not exposed, but will be
during testing of the module. This gives you a clear definition of which methods are public and which are private
to the module.

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
functions that are easily testable. You normally do not want to expose these methods to the rest of the application.
By using a "module-context" these private methods can be exposed only during testing.

The argument passed to the module function is also available in the execution context itself. An alternative convention on defining privates can be done by replacing the privates object, which has to be done like this:
```javascript
modules.create('helloWorld', function (require) {
  'use strict';
  var logger = require('logger');

  // The p variable is to be able to point to the privates 
  // from any public method, or other private method
  var p = this.privates = { 
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
<a name="templates"/>
### Adding templates
The third argument passed to the module is a *requireTemplate* function. Currently it only supports **Handlebars**.
```javascript
// FILE: helloWorld.js
modules.create('helloWorld', function (require, p, requireTemplate) {
  'use strict';
  var logger = require('logger'),
      template = requireTemplate('message');
  return {
    hello: function () {
      logger.log('Hello world!');
      document.body.innerHMTL = template({ content: 'Hello world!' });
    }
  };
});
```
> You can configure the template directory, take a look at "Initializing the project"

<a name="init"/>
### Initializing the project
```html
<!-- FILE: index.html -->
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <script src="lib/module-loader-tdd.js"></script>
    <script src="src/myModule.js"></script>
    <script src="src/myDep.js"></script>
    <script>
      modules.templatesPath = 'src/templates/'; // Sets the path to the templates, default is 'templates/'
      modules.initialize(function (require) {
         var helloWorld = require('helloWorld');
         helloWorld.hello(); // -> Hello world!
      });
    </script>
  </body>
</html>
````
>**Note** that in production all the modules will be concatinated and optimized into one single javascript file, 
avoiding any unneccesary fetching of files.

> **Note** that you could of course load a **main.js** as the last script instead of putting it inside your html
file/template

>**TIP:** When using Node JS and the HTML is delivered with a template, you can easily dynamically add the script
tags based on available .js files in your source folder. Look at the *demo*.

<a name="testing"/>
### Testing a module
Now, this is where the **module-loader-tdd** shines. Running a test on a module requires you to pass the name of 
the module and a function for testing. The function receives three arguments. The first being the the module, 
the second being its private methods and the last argument is the required dependencies inside the module being tested.

The deps object is a map of the dependencies, e.g. *deps.logger*. If the dependency is an object with methods
they are all automatically *stubbed*, which basically means that they are verifiable empty functions. We do this
to isolate the test to only the module and not trigger code that should be tested elsewhere.

Any required templates will not be fetched, it will return an empty string, as you will be testing the code that puts content into your HTML, not the HTML itself.

```javascript
// FILE: Buster.js
var config = module.exports;

config["My tests"] = {
    environment: "browser",
    rootPath: '../', // Going to parent folder of tests, where all other files are available
    libs: [
        "vendors/jquery-1.10.2.js", // Any general libs has to be loaded
        // Handlebars is not needed as you will not test templates
        "vendors/module-loader-tdd.js"
    ],
    sources: [
        "app/**/*.js" // Load modules
    ],
    tests: [
        "**/*-test.js" // Load tests
    ]
};
```

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

<a name="creating_node"/>
### Creating a module with Node js
Node JS has a module loader, but it does not have the privates and dep stubbing that **module-loader-tdd** offers. If you want that functionality also in Node you wrap each file the same way as in the browser.

Since Node JS already has a *require* function and a convention for loading files, **module-loader-tdd** does not mess with that. It only works as a "middle-man" registering all loaded modules to create a context with privates and stubbed dependencies for testing. Because of this, you do not set a name for the module.

The *requireTemplate* is not implemented on Node JS as you normally do not load templates directly and Node JS is not only web related.

```javascript
// FILE: mainModule.js
modules.create(function (require, p) {
  'use strict';
  var fs = require('fs'), // Loads the built in fs module in Node JS
      myModule = require('./myModule'); // Loads one of your own modules, relative to the file you are in
  
  p.log = function () {
    console.log('test');
  };
      
  return {
    log: function (message) {
      p.log();
    }
  };
});
```
<a name="init_node"/>
### Initializing the modules
In your main .js file for the Node project, add the following:
```javascript
require('module-loader-tdd'); // Will add "modules" to the global scope
modules.initialize(function (require) {
  var module = require('./main');
  module.log();
});

```
<a name="testing_node"/>
### Testing Node JS modules
There is little difference in testing a Node JS module. It is highly recommended to use Buster JS 
(**npm install buster -g** , and then **npm link buster** in your project). Sinon is automatically included.

```javascript
// FILE: Buster.js
var config = module.exports;

config['My tests"'] = {
    environment: "node",
    rootPath: '../', // Going to the parent folder of the tests folder
    tests: [
        "tests/**/*-test.js" // Loading the tests
    ]
}
```

```javascript
// FILE: myModule-test.js
var buster = require('buster'),
    assert = buster.assert;

modules.test('./../modules/myModule', function (myModule, p, deps) {
  'use strict';
  buster.testCase('helloWorld test', {
    'hello()': {
      'is a function': function () {
        assert.isFunction(myModule.log);
      }
  });
});
```
<a name="why"/>
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
