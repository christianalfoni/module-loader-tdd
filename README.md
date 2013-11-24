module-loader-tdd
=================

An easy to use and easy to test module loader. EXPERIMENTAL VERSION.

### Why build it?

I have been working a lot with RequireJS and have had a lot of good experiences with it. When going
TDD though, I started having problems with test libraries, test related plugins and testing Node JS. A very typical result on
Google is: "How to make X work with requirejs". So I started to think about why I was actually using RequireJS and
identify through the experience what I really needed and if I could solve it myself.

#### The parts that does not really work for me
- RequireJS requires a lot of configuration in big projects and the configuration is duplicated when running multiple
applications against the same modules. The tests also needs a RequireJS configuration
- "How to make X work with requirejs" gives a feeling of "hacking" together your project deps
- A lot of logic is running to load all the modules and "only load needed dependencies" does not really make sense
to me. When you load the project you normally want to load all your modules
- It is hard to test the modules. RequireJS modules gives a public interface, but the modules private functions and dependencies used
makes it difficult to test
- All libraries are built for normal script loading, not all are built for RequireJS. Shimmed libraries are global, which
kinda breaks the concept
- It is very complex with lots of functionality

To RequireJS defense I am not using all the functionality and maybe the projects I work on would benefit more of it with
a different structure etc, but that also indicates its complexity.

### Requirements for the module-loader-tdd

#### The basics
- Create closed modules that does not pollute the global scope
- A module can import other modules
- Module loading order should be irrelevant. A dependency not yet loaded should postpone the loading of the module
having the dependency
- It should be possible to concatinate all module files, compress and uglify wihtout breaking any code

#### Additions
- A module SCOPE, giving access to setting private functions and deps that are only exposed during testing
- A "load module to test" method which exposes private functions and deps. The deps are stubbed if using Sinon JS

### How to use it
