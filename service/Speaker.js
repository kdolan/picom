const logger = require('loglevel');
let Speaker;
try{
    Speaker = require('speaker');
}
catch (e) {
    Speaker = class  {
    };
    logger.warn('WARNING - Pi GPIO Package Not Installed. Using Mock. Run `npm run pi-i` to setup gpio on RasPi');
}

module.exports = Speaker;