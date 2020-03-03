let express = require('express');
let router = express.Router();

module.exports = function() {

    let controller = require('../controller/pi.com.controller');

    router.get('/helloworld', controller.helloWorldRoute);
    router.get('/status', controller.getStatusRoute);
    router.post('/unlatch', controller.unlatchMicRoute);

    router.post('/mumble/configure', controller.reconfigureMumbleRoute);

    return router;
};
