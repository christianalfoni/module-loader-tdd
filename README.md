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

### Additions
- A custom module context, giving access to setting private methods and deps that are only exposed during testing
- A "modules.test()" method which exposes private functions and deps. The deps are stubbed if using Sinon JS

## How to use it
You are required to load the scripts with script tags. They should be loaded in the body of your HTML so that any CSS
and/or HTML content can be displayed while loading the scripts.

**module-loader** exposes a global variable called: **modules**.

### The module 
```javascript
// FILE: myDep.js
modules.create('myDep', function () {
  'use strict';
  return {
    log: function (message) {
      console.log(message);
    }
  };
});
```

### Adding dependencies
```javascript
// FILE: myModule.js
modules.create('myModule', function () {
  'use strict';
  var myDep = this.dep('myDep');
  return {
    hello: function () {
      myDep.log('Hello world!');
    }
  };
});
```
> Even if **myDep.js** is loaded after **myModule.js** it will still work.

### Creating private methods
```javascript
// FILE: myModule.js
modules.create('myModule', function () {
  'use strict';
  var p = this.privates, // the "p" variable is for conveniance
      myDep = this.dep('myDep');

  p.sayToWorld = function (say) {
      return say + ' world!';
  };
  
  return {
    hello: function () {
      myDep.log(p.sayToWorld('Hello'));
    }
  };
});
```
**Why create these private methods?** When developing TDD and functional a core concept is creating small input-output
functions that are easily testable. In **module-loader** the context of the module has an object defined via
*this.privates*. You can register methods on this object. These are not available in the public interface returned
by the module, but will be available when testing the module.

An alternate convention is writing it like this:
```javascript
modules.create('myModule', function () {
  'use strict';
  var myDep = this.dep('myDep');

  var p = this.privates = {
    sayToWorld: function (say) {
      return say + ' world!';
    }
  };
  
  return {
    hello: function () {
      myDep.log(p.sayToWorld('Hello'));
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
      modules.initialize(function () {
         var myModule = this.dep('myModule');
         myModule.hello(); // -> Hello world!
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
```javascript
// FILE: myModule-test.js
modules.test('myModule', function (myModule) {
  'use strict';
  var p = myModule.privates,
      deps = myModule.deps;
  buster.testCase('myModule test', {
    'hello()': {
      'is a function': function () {
        assert.isFunction(myModule.hello);
      },
      'calls dependency with message': function () {
        myModule.hello();
        // Deps are stubbed methods (Sinon JS), which lets us verify their usage
        // without actually executing the code
        assert(deps.log.calledOnce); // Has the log method been called?
        assert(deps.log.calledWith('Hello world!'); // What was the log method called with?
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

In RequireJS defense I am not using all the functionality and maybe the projects I work on would benefit more with
a different structure etc, but that also indicates its complexity.
