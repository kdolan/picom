const fs = require('fs');
const AUTO_CONFIG_PATH = '/mnt/picom.usb.auto.config.json';
const WIFI_CONFIG_PATH = '/etc/wpa_supplicant/wpa_supplicant.conf';
const MUMBLE_CONFIG_PATH = '/etc/picom/config/mumble/auto.json';

console.log(`picom Automatic config utility is running...`);
try {
    if (fs.existsSync(AUTO_CONFIG_PATH)) {
        const data = require(AUTO_CONFIG_PATH);
        const wifiConfig = getWiFiConfig(data);
        if(wifiConfig) {
            console.log(`Writing WIFI config to ${WIFI_CONFIG_PATH}`);
            fs.writeFileSync(WIFI_CONFIG_PATH, wifiConfig, {encoding: 'utf8', flag: 'w'});
        }
        if(data.mumble) {
            console.log(`Writing Mumble config to ${MUMBLE_CONFIG_PATH}`);
            fs.writeFileSync(MUMBLE_CONFIG_PATH, JSON.stringify(data.mumble, null, 2), {encoding: 'utf8', flag: 'w'});
        }
    }
    else
        console.log(`Cannot find ${AUTO_CONFIG_PATH}. No config written`);
} catch(err) {
    console.error(err)
}

function getWiFiConfig(data) {
    if(!data.wifi || !data.wifi.name)
        return;
    return ""+
`
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
    ssid="${data.wifi.name}"
    key_mgmt=WPA-PSK
    psk="${data.wifi.password}"
    key_mgmt=WPA-PSK
}`;
}