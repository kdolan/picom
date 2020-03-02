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
    }

    setup(){
        this._setupCallLed();
        this._setupTalkLed();
        this._setupTxButton();
        this._setupCallButton();
    }

    _setupButton({pin, eventName}){
        const btn = new Gpio(pin, {
            mode: Gpio.INPUT,
            pullUpDown: Gpio.PUD_UP,
            alert: true
        });

        if(btn.glitchFilter)
            btn.glitchFilter(GLITCH_FILTER);

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
        log.debug('Call LED setup on ' + this.callLedPin);
    }

    _setupTalkLed(){
        this.talkLed = new Gpio(this.talkLedPin, {mode: Gpio.OUTPUT});
        log.debug('Talk LED setup on ' + this.talkLedPin);
    }

    setCallLed(state){
        if(state)
            this.callLed.digitalWrite(1);
        else
            this.callLed.digitalWrite(0);
    }

    setTalkLed(state){
        if(state)
            this.talkLed.digitalWrite(1);
        else
            this.talkLed.digitalWrite(0);
    }
}

module.exports.HardwareService = HardwareService;
