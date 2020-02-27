require('dotenv').config();
const Mic = require('mic');
const MumbleClientService = require('../service/MumbleClientService').MumbleClientService;
const Gpio = require('../service/Gpio').Gpio;

const log = require('loglevel');
if(process.env.NODE_ENV !== "production")
    log.setDefaultLevel("debug");


const CONFIG = require('../config/mumble/local');

function main() {
   const client = new MumbleClientService(CONFIG);
   client.connect()
       .then(r => {
           return client.joinChannel("Landing Channel");
       })
       .then(r => {
           client.sendMessageToCurrentChannel("Mic Client");

           const button = new Gpio(21, {
               mode: Gpio.INPUT,
               pullUpDown: Gpio.PUD_UP,
               alert: true
           });

           if(button.glitchFilter)
               button.glitchFilter(1000);
           else
               log.warn(`WARNING - No mocked glitchFilter`);

           let started = false;
           button.on('alert', (level, tick) => {
               if(!level) {
                   if(!started)
                       micInstance.start();
                   else
                       micInstance.resume();
                   log.info('Button Pressed');
               }
               else {
                   micInstance.pause();
                   log.info('Button Released');
               }
           });

           let micInstance = Mic({
               rate: '88000',
               channels: '1',
               debug: true,
               device: "hw:CARD=Device,DEV=0",
               exitOnSilence: 0
           });
           
           const micInputStream = micInstance.getAudioStream();
           let mumbleWriteStream = client.connection.inputStream();
           micInputStream.pipe(mumbleWriteStream);

           micInputStream.on('data', function(data) {
               console.log("Mic Input Stream Data: " + data.length);
           });

           micInputStream.on('error', function(err) {
               console.log("Error in Input Stream: " + err);
           });

           micInputStream.on('processExitComplete', function() {
               console.log("Got SIGNAL processExitComplete");
           });
       })
       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();