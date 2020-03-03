let controller = {};
module.exports = controller;
const util = require("../util/util");
const fs = require("fs");
const log = require('loglevel');
const {copyExistingCertConfigToNewConfig} = require("../domain/config");
const {isMumbleConfigFileValid, parseMumbleConfig, writeMumbleConfig} = require("../domain/config");

function getStatus(req){
    return {
        status: req.piCom.state,
        mumbleReady: req.piCom.mumble.connection.ready,
    }
}

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
