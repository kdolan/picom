let express = require('express');
let router = express.Router();

module.exports = function() {

    let controller = require('../controller/pi.com.controller');

    router.get('/helloworld', controller.helloWorldRoute);
    router.get('/status', controller.getStatusRoute);
    router.post('/unlatch', controller.unlatchMicRoute);

    router.post('/mumble/configure', controller.reconfigureMumbleRoute);
    router.post('/mumble/channel', controller.setMumbleChannelRoute);

    //TODO? - Maybe combine these to a single endpoint?
    router.post('/volume/mute', controller.muteVolumeRoute);
    router.post('/volume/nominal', controller.setNominalVolumeRoute);
    router.post('/volume/max', controller.setMaxVolumeRoute);
    router.post('/volume/increase', controller.increaseVolumeRoute);
    router.post('/volume/decrease', controller.decreaseVolumeRoute);

    return router;
};
