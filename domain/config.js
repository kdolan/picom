const path = require('path');
const fs = require('fs');

function isMumbleConfigValid(config) {
    return !(!config.server || !config.username || !config.key || !config.cert);
}

function isMumbleConfigFileValid(config) {
    if(!config.server || !config.username)
        return false;
    if(!config.key && !config.keyPath)
        return false;
    if(!config.cert && !config.certPath)
        return false;
    return true;
}

function parseMumbleConfig(config){
    return {
        server: config.server,
        port: config.port,
        username: config.username,
        defaultChannelName: config.defaultChannelName
    }
}

function writeMumbleConfig(config){
    const resolvedPath = path.resolve(process.env.MUMBLE_CONFIG_PATH);
    fs.writeFileSync(resolvedPath, JSON.stringify(config));
}

function copyExistingCertConfigToNewConfig({source, dest}){
    if(source.keyPath)
        dest.keyPath = source.keyPath;
    else
        dest.key = source.key.toString();

    if(source.certPath)
        dest.certPath = source.certPath;
    else
        dest.cert = source.cert.toString();

    return dest;
}

module.exports = {
    isMumbleConfigValid,
    isMumbleConfigFileValid,
    parseMumbleConfig,
    writeMumbleConfig,
    copyExistingCertConfigToNewConfig
};