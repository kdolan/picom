const log = require('loglevel');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");
const { exec } = require("child_process");

const MIN = 0;
const MAX = 37;

class AudioService{
    constructor(){

    }

    get status(){

    }

    setVolume(percentage){

    }

    increaseVolume(){

    }

    decreaseVolume(){

    }

}

function processSetVolumeOutput(output) {
    //Print Output if Flag Set
    if(process.env.DEBUG_PRINT_VOLUME_SET_RESULT)
        log.info(output);

    //Parse values
    const matches = / values=(.*)/g.exec(output);
    if(matches.length < 2){
        log.warn(`Volume Set: Unable to get parsed volume. Unable to determine if volume set successfully`);
        resolve(null);
    }
    else{
        //TODO parse min/max from output
        const [leftVol, rightVol] = matches[1].split(',');
        log.info(`Volume Set to: Left: ${leftVol}/${MAX}, Right: ${rightVol}/${MAX}`);
        resolve({leftVol, rightVol});
    }
}

function execPromise(command){
    return new Promise((resolve, reject) =>{
        exec(command, (error, stdout, stderr) => {
            if (error) {
                log.error(`Volume Command Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                log.error(`Volume Command Error: ${stderr}`);
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

module.exports.AudioService = AudioService;