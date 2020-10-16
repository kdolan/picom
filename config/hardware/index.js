const HARDWARE_CONFIG = {
    callButtonPin: 20,
    txButtonPin: 21,

    volIncreasePin: 24,
    volDecreasePin: 23,
    volMutePin: 18, //Conflict with HAT
    volNominalPin: 25,

    callLedPin: 19, //Conflict with HAT
    talkLedPin: 26
};

module.exports = HARDWARE_CONFIG;