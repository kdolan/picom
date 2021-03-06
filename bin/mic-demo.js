require('dotenv').config();
const Mic = require('mic');
const MumbleClientService = require('../service/MumbleClientWrapper').MumbleClientService;
const Gpio = require('../service/Gpio').Gpio;
const Speaker = require('speaker');

const CALL_BTN_PIN=20;
const TX_BTN_PIN=21;
const CALL_LED_PIN=26;
const GLITCH_FILTER=1000;

const log = require('loglevel');
if(process.env.NODE_ENV !== "production")
    log.setDefaultLevel("debug");


const CONFIG = require('../config/mumble/local');

function setupTxButton({micInstance}) {
    const txButton = new Gpio(TX_BTN_PIN, {
        mode: Gpio.INPUT,
        pullUpDown: Gpio.PUD_UP,
        alert: true
    });

    if(txButton.glitchFilter)
        txButton.glitchFilter(GLITCH_FILTER);
    else
        log.warn(`WARNING - No mocked glitchFilter`);

    txButton.on('alert', (level, tick) => {
        if(!level) {
            log.info('Tx Button Pressed');
            micInstance.resume();
        }
        else {
            micInstance.pause();
            log.info('Tx Button Released');
        }
    });
}

function setupCallButton({led, sendMessageFn}) {
    const callButton = new Gpio(CALL_BTN_PIN, {
        mode: Gpio.INPUT,
        pullUpDown: Gpio.PUD_UP,
        alert: true
    });

    if(callButton.glitchFilter)
        callButton.glitchFilter(GLITCH_FILTER);
    else
        log.warn(`WARNING - No mocked glitchFilter`);

    callButton.on('alert', (level, tick) => {
        if(!level) {
            log.info('Call Button Pressed');
            led.digitalWrite(1);
            sendMessageFn("CALLING");
        }
        else {
            led.digitalWrite(0);
            log.info('Call Button Released');
            sendMessageFn("END CALLING");
        }
    });
}

function setupCallLed() {
    const led = new Gpio(CALL_LED_PIN, {mode: Gpio.OUTPUT});
    log.debug('Call LED setup on ' + CALL_LED_PIN);
    return led;
}

function main() {
   const client = new MumbleClientService(CONFIG);
   client.connect()
       .then(r => {
           return client.joinChannelByName("Landing Channel");
       })
       .then(r => {
           client.sendMessageToCurrentChannel("Mic Client");

           let micInstance = Mic({
               rate: '88000',
               channels: '1',
               debug: true,
               device: "hw:CARD=Device,DEV=0",
               exitOnSilence: 0
           });

           const speaker = new Speaker({
               channels: 1,
               bitDepth: 16,
               device: "plughw:1,0"
           });

           const outputStream = client.connection.outputStream(undefined, true);
           outputStream.pipe(speaker);

           const callLed = setupCallLed();
           setupTxButton({micInstance});
           setupCallButton({led: callLed, sendMessageFn: (message) => client.sendMessageToCurrentChannel(message)});

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

           client.on('message', ({message, user}) => {
               if(message === "CALLING") {
                   log.info(`Call signal received from ${user.name}`);
                   callLed.digitalWrite(1);
               }
               else if(message === "END CALLING") {
                   log.info(`Call signal ended from ${user.name}`);
                   callLed.digitalWrite(0);
               }
           });

           micInstance.start();
           micInstance.pause();
       })
       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();