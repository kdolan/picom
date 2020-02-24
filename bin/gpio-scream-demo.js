require('dotenv').config();

const fs = require('fs');
const MumbleClientService = require('../service/MumbleClientService').MumbleClientService;
const Gpio = require('../service/Gpio').Gpio;
const log = require('loglevel');
if(process.env.NODE_ENV !== "production")
    log.setDefaultLevel("debug");

const screamSteam = fs.createReadStream('./sounds/falling.wav');

const CONFIG = require('../config/mumble/local');

const FREQ = (1*process.env.FREQ) || 200;

function generateSound(phase=0) {
    let b = new Buffer(480*2);
    for( var i = 0; i < 480; i++ ) {
        var sample = Math.round( Math.sin( Math.PI*2*(phase+i)*FREQ/48000 ) * (1<<12) );
        b.writeInt16LE( sample, i*2 );
    }
    return b;
}

let holding = false;

function writeLoop({stream}) {
    let phase = 0;

    const writeTone = () => {
        // Fill the buffer
        while( stream.write( generateSound(phase) ) ) {}

        // Wait for the buffer to drain
        stream.once( 'drain', writeTone );
    };

    if(holding) {
        log.info('Writing Tone...');
        writeTone({stream, phase});
        phase += 480;
    }
    else
        phase = 0;
    setTimeout(() => writeLoop({stream}), 100);
}

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
               if(!level) {
                   holding = true;
                   log.info('Button Pressed');
               }
               else {
                   holding = false;
                   log.info('Button Released');
               }
           });

           writeLoop({stream: client.connection.inputStream()})
       })

       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();