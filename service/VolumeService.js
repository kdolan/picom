const log = require('loglevel');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");
const { exec } = require("child_process");

const MIN = 0;
const MAX = 37;
const STEP = Math.round((100/MAX)).toFixed(0);

class VolumeService{
    /**
     *
     * @param volumeSetCb Callback when volume is changed.
     */
    constructor({volumeSetCb=null}={}){
        this.rawLeftVol = null;
        this.rawRightVol = null;
        if(volumeSetCb && typeof volumeSetCb !== "function")
            throw new Error("volumeSetCb must be of type function");
        this.volumeSetCb = volumeSetCb;
    }

    get status(){
        if(this.rawRightVol === null)
            return {
                left: null,
                right: null
            };

        return {
            left: ((this.rawLeftVol/MAX)*100).toFixed(0),
            right: ((this.rawRightVol/MAX)*100).toFixed(0)
        }
    }

    async increaseVolume(){
        const result = await _setVolume(this.status.left + STEP);
        this._audioChanged(result);
    }

    async decreaseVolume(){
        const result = await _setVolume(this.status.left - STEP);
        this._audioChanged(result);    }

    async mute(){
        const result = await _setVolume(0);
        this._audioChanged(result);    }

    async setMaxVolume(){
        const result = await _setVolume(100);
        this._audioChanged(result);    }

    async setNominalVolume(){
        const result = await _setVolume(50);
        this._audioChanged(result);    }

    _audioChanged({leftVol, rightVol}){
        this.rawLeftVol = leftVol;
        this.rawRightVol = rightVol;
        if(this.volumeSetCb)
            this.volumeSetCb();
    }
}

async function _setVolume(percentage){
    const num = Number(percentage);
    if(isNaN(num)) //Driver handles values outside range 0-100
        throw new ErrorWithStatusCode({code: 400, message: `The provided percentage ${percentage} is invalid.`});
    return _execVolumePromise(`amixer -c 1 cset numid=6 ${num}%`);
}

async function _execVolumePromise(command){
    return new Promise((resolve, reject) =>{
        exec(command, (error, stdout, stderr) => {
            if (error) {
                log.error(`Volume Command Error: ${error.message}`);
                reject(new ErrorWithStatusCode({code: 500, message: "Unable to set volume", innerError: error}));
                return;
            }
            if (stderr) {
                log.error(`Volume Command Error: ${stderr}`);
                reject(new ErrorWithStatusCode({code: 500, message: "Unable to set volume", innerError: stderr}));
                return;
            }
            resolve(_processSetVolumeOutput(stdout));
        });
    });
}

function _processSetVolumeOutput(output) {
    //Print Output if Flag Set
    if(process.env.DEBUG_PRINT_VOLUME_SET_RESULT === "TRUE")
        log.info(`RAW VOLUME SET OUTPUT:\n ${output}`);

    //Parse values
    const matches = / values=(.*)/g.exec(output);
    if(matches.length < 2){
        log.warn(`Volume Set: Unable to get parsed volume. Unable to determine if volume set successfully`);
        return null;
    }
    else{
        //TODO parse min/max from output
        const [leftVol, rightVol] = matches[1].split(',');
        log.info(`Volume Set to: Left: ${leftVol}/${MAX}, Right: ${rightVol}/${MAX}`);
        return {leftVol, rightVol};
    }
}

module.exports.VolumeService = VolumeService;