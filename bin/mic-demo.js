require('dotenv').config();
const Mic = require('mic');
const MumbleClientService = require('../service/MumbleClientService').MumbleClientService;
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

           let micInstance = Mic({
               rate: '88000',
               channels: '1',
               debug: true,
               device: "hw:CARD=Device,DEV=0",
               exitOnSilence: 6
           });
           const micInputStream = micInstance.getAudioStream();
           micInputStream.pipe(client.connection.inputStream());

           micInputStream.on('data', function(data) {
               console.log("Mic Input Stream Data: " + data.length);
           });

           micInputStream.on('silence', function() {
               console.log("Got SIGNAL silence");
           });

           micInstance.start();
       })
       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();