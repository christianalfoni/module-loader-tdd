require('./../../module-loader');
modules.initialize(function (require) {

    var express = require('express');
    var fs = require('fs');
    var readdir = require('recursive-readdir');
    var app = express();

    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/demo/templates');
    app.use(express.static(__dirname));
    app.get('/', function(req, res){

        // Read all available js files, but ignore vendors
        readdir('demo', function (err, files) {
            // Files is an array of filename
            var sourceFiles = [];
            files.forEach(function (file, index) {
                if (file.match(/\.js/) && !file.match(/vendors/) && !file.match(/tests/)) {
                    sourceFiles.push(file);
                }
            });

            res.render('index', {
                sourceFiles: sourceFiles
            });
        });

    });

    app.listen(3000);

});