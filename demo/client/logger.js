modules.create('logger', function () {
    'use strict';
    return {
        log: function (message) {
            console.log(message);
        }
    }
});