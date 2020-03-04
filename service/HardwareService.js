const log = require('loglevel');
const Gpio = require('../service/Gpio').Gpio;
const EventEmitter = require('events');

const GLITCH_FILTER=1000;

class HardwareService extends EventEmitter{
    constructor({callButtonPin, txButtonPin, callLedPin, talkLedPin}){
        super();

        this.callButtonPin = callButtonPin;
        this.txButtonPin = txButtonPin;
        this.callLedPin = callLedPin;
        this.talkLedPin = talkLedPin;

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
        this._setupButton({pin: this.txButtonPin, eventName: 'txButton'});
    }

    _setupCallButton(){
        this._setupButton({pin: this.callButtonPin, eventName: 'callButton'});
    }

    _setupCallLed(){
        this.callLed = new Gpio(this.callLedPin, {mode: Gpio.OUTPUT});
        this.callLed.digitalWrite(0);

        log.debug('Call LED setup on ' + this.callLedPin);
    }

    _setupTalkLed(){
        this.talkLed = new Gpio(this.talkLedPin, {mode: Gpio.OUTPUT});
        this.talkLed.digitalWrite(0);

        log.debug('Talk LED setup on ' + this.talkLedPin);
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

module.exports.HardwareService = HardwareService;
