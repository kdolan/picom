let controller = {};
module.exports = controller;
const util = require("../util/util");
const fs = require("fs");
const log = require('loglevel');
const {copyExistingCertConfigToNewConfig} = require("../domain/config");
const {isMumbleConfigFileValid, parseMumbleConfig, writeMumbleConfig} = require("../domain/config");

const AUDIO_NOT_SETUP = require('../domain/status.constants').AUDIO.AUDIO_NOT_SETUP;

function getStatus(req){
    return req.piCom.status;
}

//TODO Refactor into API Service Controllers

controller.helloWorldRoute = function (req, res) {
    req.piCom.mumble.sendMessageToCurrentChannel(`Hello World From API. API Says '${req.query.message}'`);
    res.json({status: 'ok'});
};

controller.getStatusRoute = function(req, res) {
    res.json(getStatus(req));
};

controller.unlatchMicRoute = function(req, res) {
    try {
        req.piCom.unLatchMic();
        res.json(getStatus(req));
    }
    catch (err) {
        util.standardErrorResponse(err, res);
    }
};

controller.reconfigureMumbleRoute = function (req, res) {
    const newConfig = parseMumbleConfig(req.body);

    //TODO Allow certs to be set from UI
    copyExistingCertConfigToNewConfig({source: req.piCom.mumbleConfig, dest: newConfig});

    if(!isMumbleConfigFileValid(newConfig)){
        log.error('New Config is invalid');
        res.status(400).json({message: "Config is not valid"});
        return;
    }

    try{
        writeMumbleConfig(newConfig);
        req.piCom.reconfigureMumbleAndReconnect(newConfig)
            .then(done => {
                res.json(getStatus(req));
            }).catch(err => util.standardErrorResponse(err, res));
    }
    catch (err) {
        util.standardErrorResponse(err, res);
    }

};

//VOLUME - TODO Move
function audioNotSetupRes(req, res){ //TODO Middleware
    if(req.piCom.audio.status.state === AUDIO_NOT_SETUP) {
        res.status(400).json({message: "Interacting with the audio service is not possible. Hardware Audio Support not setup"});
        return true;
    }
    else
        return false;
}

controller.muteVolumeRoute = function (req, res) {
    if(audioNotSetupRes(req, res))
        return;

    req.piCom.audio.volume.mute()
        .then(r => {
            res.json(getStatus(req));
        }).catch(err => util.standardErrorResponse(err, res));
};

controller.setMaxVolumeRoute = function (req, res) {
    if(audioNotSetupRes(req, res))
        return;

    req.piCom.audio.volume.setMaxVolume()
        .then(r => {
            res.json(getStatus(req));
        }).catch(err => util.standardErrorResponse(err, res));
};

controller.setNominalVolumeRoute = function (req, res) {
    if(audioNotSetupRes(req, res))
        return;

    req.piCom.audio.volume.setNominalVolume()
        .then(r => {
            res.json(getStatus(req));
        }).catch(err => util.standardErrorResponse(err, res));
};

controller.increaseVolumeRoute = function (req, res) {
    if(audioNotSetupRes(req, res))
        return;

    req.piCom.audio.volume.increaseVolume()
        .then(r => {
            res.json(getStatus(req));
        }).catch(err => util.standardErrorResponse(err, res));
};

controller.decreaseVolumeRoute = function (req, res) {
    if(audioNotSetupRes(req, res))
        return;

    req.piCom.audio.volume.decreaseVolume()
        .then(r => {
            res.json(getStatus(req));
        }).catch(err => util.standardErrorResponse(err, res));
};