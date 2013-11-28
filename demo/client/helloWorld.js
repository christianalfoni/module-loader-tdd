modules.create('helloWorld', function (require, p, requireTemplate) {
    var logger = require('logger'),
        template = requireTemplate('message');

    p.sayToWorld = function (say) {
        return say + ' world!';
    }

    return {
        hello: function () {
            var message = p.sayToWorld('Hello');
            logger.log(message);
            return template({message: message});
        }
    }
});