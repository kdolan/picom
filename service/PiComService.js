const {HardwareService} = require("./HardwareService");
const {MumbleClientWrapper} = require("./MumbleClientWrapper");
const Speaker = require('./Speaker');
const Mic = require('mic');
const log = require('loglevel');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");

const UP = "UP";
const DOWN = "DOWN";
const LATCH_TIME_MS=500;

class PiComService{
    constructor({mumbleConfig, hardwareConfig}) {
        this.mumble = new MumbleClientWrapper(mumbleConfig);
        this.hardware = new HardwareService(hardwareConfig);

        this.mumbleConfig = mumbleConfig;
        this.hardwareConfig = hardwareConfig;

        this.state = {
            calling: false,
            transmitting: false,
            micLatch: false
        };

        this._txTimes = [];
        this._stopTxTimes = [];
    }

    async reconfigureMumbleAndReconnect(newConfig){
        this.mumbleConfig = newConfig;
        await this.mumble.disconnect();
        this.mumble = new MumbleClientWrapper(newConfig);
        await this._connectMumble();
    }

    async setup(){
        this.hardware.setup();
        await this._connectMumble();
        this._bindHardwareEvents();
    }

    async _connectMumble(){
        await this.mumble.connect();
        //Audio always needs to be configured after the mumble client is connected
        this._setupAudio();
        //If Default Channel Set Join it
        if(this.mumbleConfig.defaultChannelName) {
            try {
                await this.mumble.joinChannel(this.mumbleConfig.defaultChannelName);
            }
            catch (err) {
                if(err.code === 404)
                    log.warn(`The Default Channel '${this.mumbleConfig.defaultChannelName}' does not exist. Client will stay in root channel`);
                else
                    throw err;
            }
        }
    }
  
    unLatchMic(){
        if(this.state.micLatch) {
            log.info(`Triggering Remove Mic Unlatch at ${new Date().toTimeString()}`);
            this._txEvent(UP); //Simulate releasing talk button event
        }
        else{
            const message = `Cannot unlatch. Mic not latched`;
            log.error(message);
            throw new ErrorWithStatusCode({code: 400, message});
        }
    }
    _setupAudio(){
        if(!process.env.DEBUG_DISABLE_AUDIO_HARDWARE !== "TRUE") {
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

            const outputStream = this.mumble.connection.outputStream(undefined, true);
            outputStream.pipe(this.speaker);
        }
        catch (e) {
            if(process.env.DEBUG_IGNORE_AUDIO_ERRORS === "TRUE"){
                log.warn(`Audio Setup Failed. Warning - DEBUG_IGNORE_AUDIO_ERRORS is SET`);
                return;
            }
            log.error(`Audio Setup Failed. Error`, e);
            throw e;
        }
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
            let mumbleWriteStream = this.mumble.connection.inputStream();
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

    _bindHardwareEvents(){
        this.hardware.on('txButton-down', () => this._txEvent(DOWN));
        this.hardware.on('txButton-up', () => this._txEvent(UP));

        this.hardware.on('callButton-down', () => this._callEvent(DOWN));
        this.hardware.on('callButton-up', () => this._callEvent(UP));
    }

    _txEvent(state){
        if(state === DOWN) {
            this.mic.resume();
            this._txTimes.unshift(new Date());
            this._txTimes = this._txTimes.slice(0,2);

            this.state.transmitting = true;
            this.hardware.setTalkLed(true);
        }
        else {
            this._stopTxTimes.unshift(new Date());
            this._stopTxTimes = this._stopTxTimes.slice(0,2);

            this.state.micLatch = false;
            this._latchLogic(); //Determines if the mic should be latched by setting state.micLatch
            if(!this.state.micLatch) {
                this.mic.pause();
                this.state.transmitting = false;
                this.hardware.setTalkLed(false);
            }
        }
    }

    _callEvent(state){
        this.state.calling = state === DOWN;
        this.hardware.setCallLed(state === DOWN);
        this.mumble.sendMessageToCurrentChannel(state === DOWN ? "CALLING" : "END CALLING");
    }

    _latchLogic(){
        if(this._txTimes.length === 2){
            const firstHoldDuration = this._stopTxTimes[1] - this._txTimes[1].getTime();
            const secondHoldDuration = this._stopTxTimes[0] - this._txTimes[0].getTime();
            const timeBetweenTxEvents = this._txTimes[0].getTime() - this._txTimes[1].getTime();

            if(firstHoldDuration <= LATCH_TIME_MS && secondHoldDuration <= LATCH_TIME_MS && timeBetweenTxEvents <= LATCH_TIME_MS * 1.5){
                log.debug(`Enabling Latch: First Hold ${firstHoldDuration}, Second Hold: ${secondHoldDuration}, Tx Interval: ${timeBetweenTxEvents}`);
                this.state.micLatch = true;
                this._txTimes = [];
                return;
            }
            else
                log.debug(`Not Latching: First Hold ${firstHoldDuration}, Second Hold: ${secondHoldDuration}, Tx Interval: ${timeBetweenTxEvents}`);
        }
        this.state.micLatch = false;
    }
}

module.exports.PiComService = PiComService;