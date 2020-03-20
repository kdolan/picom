const fs = require('fs');
const path = require('path');
const log = require('loglevel');
const {isMumbleConfigValid} = require("../../domain/config");

const CONFIG = {
    server: process.env.MUMBLE_SERVER ? process.env.MUMBLE_SERVER : null,
    port: process.env.MUMBLE_PORT ? process.env.MUMBLE_PORT : null,
    username: process.env.MUMBLE_USERNAME ? process.env.MUMBLE_USERNAME : null,
    defaultChannelName: process.env.MUMBLE_DEFAULT_CHANNEL_NAME ? process.env.MUMBLE_DEFAULT_CHANNEL_NAME : null,
    key: process.env.MUMBLE_AUTH_KEY ? process.env.MUMBLE_AUTH_KEY : null,
    cert: process.env.MUMBLE_AUTH_CERT ? process.env.MUMBLE_AUTH_CERT : null
};

let configFile = {};
if(process.env.MUMBLE_CONFIG_PATH) {
    const resolvedPath = path.resolve(process.env.MUMBLE_CONFIG_PATH);
    log.info(`Reading Mumble Configuration from ${resolvedPath}`);
    configFile = JSON.parse(fs.readFileSync(resolvedPath));
    log.debug(`   Mumble Config: ${JSON.stringify(configFile)}`);
}
else {
    log.warn(`No Config File Path Specified by MUMBLE_CONFIG_PATH. Using Only Env Vars for config`);

    if(!isMumbleConfigValid(CONFIG)){
        log.error(`FATAL ERROR: Invalid configuration. Missing required parameters.`);
        process.exit(1);
    }
}

if(!CONFIG.server)
    CONFIG.server = configFile.server;

if(!CONFIG.port)
    CONFIG.port = configFile.port || "64738";

if(!CONFIG.username)
    CONFIG.username = configFile.username;

if(!CONFIG.defaultChannelName)
    CONFIG.defaultChannelName = configFile.defaultChannelName;

if(!CONFIG.key){
    CONFIG.key =  fs.readFileSync( path.resolve(configFile.keyPath ));
    CONFIG.keyPath = configFile.keyPath;
}

if(!CONFIG.cert) {
    CONFIG.cert = fs.readFileSync(path.resolve(configFile.certPath));
    CONFIG.certPath = configFile.certPath;
}

module.exports = CONFIG;
