const log = require('loglevel');
const Gpio = require('../service/Gpio').Gpio;
const EventEmitter = require('events');

const GLITCH_FILTER=1000;

const HARDWARE_EVENTS = {
    txEvent: "txButton",
    callEvent: "callButton",
    volMuteEvent: "volMuteButton",
    volNominalEvent: "volNominalButton",
    volIncreaseEvent: "volIncreaseButton",
    volDecreaseEvent: "volDecreaseButton"
};

class HardwareService extends EventEmitter{
    constructor(hardwareConfig){
        super();

        this.hardwareConfig = hardwareConfig;

        this._setupDone = false;
        this._errorFlasherEnabled = false;
        this._errorFlasherInterval = null;

        this._leds = {
            callLedOn: false,
            talkLedOn: false
        }
    }

    get status(){
        return {
            setupDone: this._setupDone,
            led: this._leds
        }
    }

    setup(){
        this._setupCallLed();
        this._setupTalkLed();

        this._setupTxButton();
        this._setupCallButton();

        this._setupDone = true;
    }

    setCallLed(state){
        this._leds.callLedOn = !!state;
        if(state)
            this.callLed.digitalWrite(1);
        else
            this.callLed.digitalWrite(0);
    }

    setTalkLed(state){
        this._leds.talkLedOn = !!state;
        if(state)
            this.talkLed.digitalWrite(1);
        else
            this.talkLed.digitalWrite(0);
    }

    setErrorFlasher(enabled){
        if(!this._errorFlasherEnabled && enabled) {
            this._errorFlasherEnabled = true;
            this._errorFlasherInterval = setInterval(() => this._errorFlasherCallback(), 250);
        }
        else if(this._errorFlasherEnabled && !enabled){
            this._errorFlasherEnabled = false;
            clearInterval(this._errorFlasherInterval);
            this.setCallLed(false);
            this.setTalkLed(false);
        }

    }

    _setupButton({pin, eventName}){
        const btn = new Gpio(pin, {
            mode: Gpio.INPUT,
            pullUpDown: Gpio.PUD_UP,
            alert: true
        });

        if(btn.glitchFilter)
            btn.glitchFilter(GLITCH_FILTER);

        log.debug(`${eventName} button setup on ${pin}`);

        btn.on && btn.on('alert', (level, tick) => {
            if(!level) {
                this.emit(`${eventName}-down`, tick);
                log.info(`${eventName} Button Pressed`);
            }
            else {
                this.emit(`${eventName}-up`, tick);
                log.info(`${eventName} Button Released`);
            }
        });
    }

    _setupTxButton(){
        this._setupButton({pin: this.hardwareConfig.txButtonPin, eventName: HARDWARE_EVENTS.txEvent});
    }

    _setupCallButton(){
        this._setupButton({pin: this.hardwareConfig.callButtonPin, eventName: HARDWARE_EVENTS.callEvent});
    }

    _setupVolMuteButton(){
        this._setupButton({pin: this.hardwareConfig.volMutePin, eventName: HARDWARE_EVENTS.volMuteEvent});
    }

    _setupVolNominalButton(){
        this._setupButton({pin: this.hardwareConfig.volNominalPin, eventName: HARDWARE_EVENTS.volNominalEvent});
    }

    _setupVolIncreaseButton(){
        this._setupButton({pin: this.hardwareConfig.volIncreasePin, eventName: HARDWARE_EVENTS.volIncreaseEvent});
    }

    _setupVolDecreaseButton(){
        this._setupButton({pin: this.hardwareConfig.volDecreasePin, eventName: HARDWARE_EVENTS.volDecreaseEvent});
    }

    _setupCallLed(){
        this.callLed = new Gpio(this.hardwareConfig.callLedPin, {mode: Gpio.OUTPUT});
        this.callLed.digitalWrite(0);

        log.debug('Call LED setup on ' + this.hardwareConfig.callLedPin);
    }

    _setupTalkLed(){
        this.talkLed = new Gpio(this.hardwareConfig.talkLedPin, {mode: Gpio.OUTPUT});
        this.talkLed.digitalWrite(0);

        log.debug('Talk LED setup on ' + this.hardwareConfig.talkLedPin);
    }

    _errorFlasherCallback(){
        if(this.status.led.callLedOn){
            this.setCallLed(false);
            this.setTalkLed(true);
        }
        else{
            this.setCallLed(true);
            this.setTalkLed(false);
        }
    }
}

module.exports = {HardwareService, HARDWARE_EVENTS};
