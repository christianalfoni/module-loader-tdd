modules.create('view.Todo', function (require, p, requireTemplate) {
    'use strict';


    return Backbone.View.extend({
        className: 'wrapper',
        events: {},
        initialize: function () {
            this.collection = require('collection.Todo');
        },
        render: function () {
            this.$el.html(requireTemplate('todos'));
            return this;
        }
    });

});