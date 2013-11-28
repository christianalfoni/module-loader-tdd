require('./../../lib/module-loader-tdd');
modules.initialize(function (require) {

    var path = require('path');
    var express = require('express');
    var fs = require('fs');
    var readdir = require('recursive-readdir');
    var app = express();

    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/templates');
    app.use('/vendors', express.static(__dirname + '/../client/vendors'));
    app.use('/lib', express.static(__dirname + '/../../lib'));
    app.use('/js', express.static(__dirname + '/../client'));
    app.use('/templates', express.static(__dirname + '/../client/templates'));
    app.get('/', function(req, res){

        // Read all available js files, but ignore vendors
        readdir('demo/client', function (err, files) {
            // Files is an array of filename
            var sourceFiles = [];
            files.forEach(function (filePath, index) {
                if (filePath.match(/\.js/) && !filePath.match(/vendors/) && !filePath.match(/tests/)) {
                    sourceFiles.push(path.basename(filePath));
                }
            });

            res.render('index', {
                sourceFiles: sourceFiles
            });
        });

    });

    app.listen(3000);

});