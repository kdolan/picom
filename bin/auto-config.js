const fs = require('fs');
const AUTO_CONFIG_PATH = '/media/usb/picom.usb.auto.config.json';
const WIFI_CONFIG_PATH = '/etc/wpa_supplicant/wpa_supplicant.conf';
const MUMBLE_CONFIG_PATH = '/etc/picom/config/mumble/auto.json';

try {
    if (fs.existsSync(AUTO_CONFIG_PATH)) {
        const data = require(AUTO_CONFIG_PATH);
        const wifiConfig = getWiFiConfig(data);
        if(wifiConfig)
            fs.writeFileSync(WIFI_CONFIG_PATH,wifiConfig,{encoding:'utf8',flag:'w'});
        if(data.mumble)
            fs.writeFileSync(MUMBLE_CONFIG_PATH,JSON.stringify(data.mumble, null, 2),{encoding:'utf8',flag:'w'});
    }
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