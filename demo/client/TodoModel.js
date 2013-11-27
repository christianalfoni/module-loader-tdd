modules.create('model.Todo', function (require) {
    'use strict';
    var textHelper = require('helper.text');
    return Backbone.Model.extend({
        defaults: {
            isDone: false,
            message: ''
        }
    });
});