const logger = require('loglevel');
let gpio;
try{
    gpio = require('pigpio');
}
catch (e) {
    gpio = require('pigpio-mock');
    logger.warn('WARNING - Pi GPIO Package Not Installed. Using Mock. Run `npm run pi-i` to setup gpio on RasPi');
}

module.exports = gpio;