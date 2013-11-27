module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                mangle: {
                    except: ['jQuery', 'Backbone', '_', '$']
                }
            },
            build: {
                files: {
                    'demo/dist/demo.min.js': [
                        'demo/client/vendors/underscore.js',
                        'demo/client/vendors/jquery-1.10.2.js',
                        'demo/client/vendors/backbone.js',
                        'module-loader.js',
                        'demo/client/*.js']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);

};