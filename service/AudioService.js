const Speaker = require('./Speaker');
const Mic = require('mic');
const log = require('loglevel');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");
const generateTone = require('../util/sin.pcm').generateTone;
const merge2 = require('merge2');

const {AUDIO} = require('../domain/status.constants');
const {AUDIO_NOT_SETUP, AUDIO_SETUP_ERROR, AUDIO_CONFIGURED} = {...AUDIO};

class AudioService{
    constructor({piCom}){
        this._piCom = piCom;
        this._audioStatus = AUDIO_NOT_SETUP;
    }

    get status(){
        return this._audioStatus;
    }

    setupAudio(){
        if(process.env.DEBUG_DISABLE_AUDIO_HARDWARE === "TRUE") {
            log.warn(`Hardware Audio Disabled. DEBUG_DISABLE_AUDIO_HARDWARE is set`);
            return;
        }

        try {
            this._setupMic();

            this.speaker = new Speaker({
                channels: 1,
                bitDepth: 16,
                device: "plughw:1,0"
            });

            const mumbleOutputStream = this._piCom.mumble.connection.outputStream(undefined, true);
            mumbleOutputStream.pipe(this.speaker);
            //Connect the mumble audio to the mumble input on the mixer
            this.mergeStream = merge2(mumbleOutputStream);
            //Connect the mixer output to the speaker
            //this.mergeStream.pipe(this.speaker);
        }
        catch (e) {
            if(_ignoreAudioErrors(`Audio Setup Failed. Warning - DEBUG_IGNORE_AUDIO_ERRORS is SET`))
                return;
            this._audioStatus = AUDIO_SETUP_ERROR;
            log.error(`Audio Setup Failed. Error`, e);
            throw e;
        }

        this._audioStatus = AUDIO_CONFIGURED;
        //Play test beeps
        this.playBeep({durationMs: 50, freqHz: 440});
        setTimeout( () => this.playBeep({durationMs: 150, freqHz: 440*2}), 50);
    }

    disconnectAudio(){
        this._audioStatus = AUDIO_NOT_SETUP;
        this.speaker.close();
        this.mic.stop();
    }

    playBeep({durationMs=200, freqHz=440}={}){
        if(this._audioStatus !== AUDIO_CONFIGURED) {
            const message = "Cannot play beep. Audio is not configured";
            if(_ignoreAudioErrors(`${message}. Warning - DEBUG_IGNORE_AUDIO_ERRORS is SET`))
                return;
            throw new ErrorWithStatusCode({code: 500, message });
        }

        this.mergeStream.add(generateTone({freq: freqHz, durationSec: durationMs / 1000}));
    }

    _setupMic(){
        try {
            this.mic = Mic({
                rate: '88000',
                channels: '1',
                debug: true,
                device: "hw:CARD=Device,DEV=0",
                exitOnSilence: 0
            });

            const micInputStream = this.mic.getAudioStream();
            let mumbleWriteStream = this._piCom.mumble.connection.inputStream();
            micInputStream.pipe(mumbleWriteStream);

            micInputStream.on('data', function (data) {
                log.debug("Mic Input Stream Data: " + data.length);
            });

            micInputStream.on('error', function (err) {
                log.error("Error in Mic Input Stream: " + err);
            });

            micInputStream.on('processExitComplete', function () {
                log.warn("Got SIGNAL processExitComplete");
            });

            //Start the mic stream but pause it immediately since it is not transmitting
            this.mic.start();
            this.mic.pause();
        }
        catch (e) {
            if(process.env.DEBUG_IGNORE_AUDIO_ERRORS === "TRUE"){
                log.warn(`Mic Setup Failed. Warning - DEBUG_IGNORE_AUDIO_ERRORS is SET`);
                return;
            }
            log.error(`Mic Setup Failed. Error`, e);
            throw e;
        }
    }
}

function _ignoreAudioErrors(warnMessage){
    if(process.env.DEBUG_IGNORE_AUDIO_ERRORS === "TRUE"){
        log.warn(warnMessage);
        return true;
    }
}

module.exports.AudioService = AudioService;