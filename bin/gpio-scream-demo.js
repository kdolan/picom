require('dotenv').config();

const fs = require('fs');
const MumbleClientService = require('../service/MumbleClientService').MumbleClientService;
const Gpio = require('../service/Gpio').Gpio;
const log = require('loglevel');

const screamSteam = fs.createReadStream('./sounds/falling.wav');

const CONFIG = require('../config/mumble/local');

function main() {
   const client = new MumbleClientService(CONFIG);
   client.connect()
       .then(r => {
           return client.joinChannel("Landing Channel");
       })
       .then(r => {
           client.sendMessageToCurrentChannel("GPIO Client");

           const button = new Gpio(21, {
               mode: Gpio.INPUT,
               pullUpDown: Gpio.PUD_UP,
               alert: true
           });

           if(button.glitchFilter)
                button.glitchFilter(10000);
           else
               log.warn(`WARNING - No mocked glitchFilter`);

           button.on('alert', (level, tick) => {
               client.playReadableStream(screamSteam);
           });
       })
       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();