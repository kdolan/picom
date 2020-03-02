let express = require('express');
//var favicon = require('serve-favicon');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let helmet = require('helmet');
let logger = require('loglevel');

let router = require('./routes/router');

const PiComService = require('./service/PiComService').PiComService;
const MUMBLE_CONFIG = require('./config/mumble');
const HARDWARE_CONFIG = require('./config/hardware');

async function initPiComService() {
    const piCom = new PiComService({mumbleConfig: MUMBLE_CONFIG, hardwareConfig: HARDWARE_CONFIG});
    await piCom.setup();
    return piCom;
}

//Starts the application given the db and returns the express app
async function startApp(app, piCom) {
    const ch = await piCom.mumble.joinChannel("Landing Channel");
    piCom.mumble.sendMessageToCurrentChannel("Test");

    //Standard middleware
    expressMiddlewareInit(app);
    router.configureRoutes(app, piCom);

    errorHandlingMiddleware(app);
}

function expressMiddlewareInit(app){
    app.use(helmet());

    // uncomment after placing your favicon in /public
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(morgan('dev', {stream: logger.stream}));
    app.use(bodyParser.json({ extended: true, limit: '25mb' }));
    app.use(bodyParser.urlencoded({extended: false}));
}

function errorHandlingMiddleware(app){
    // error handler
    app.use(function (err, req, res, next) {
        //Log error
        logger.error(`Unhandled Error: ${err.stack}`);
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.json({"error": err.status});
    });
}


//Create app
let app = express();
//Print environment
let envName = process.env.NODE_ENV;
if(!envName)
    envName = "default";
logger.debug("Environment: " + envName);

//Start the application (Pass in startApp function as callback)
async function initApp(callback) {
        const piCom = await initPiComService();
        await startApp(app, piCom);
        callback(app);
}

//Return the express app.
module.exports.initApp = initApp;
