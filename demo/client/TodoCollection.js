modules.create('collection.Todo', function (require) {
    return Backbone.Collection.extend({
        model: require('model.Todo')
    });
});