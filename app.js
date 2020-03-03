let express = require('express');
//var favicon = require('serve-favicon');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let helmet = require('helmet');
let logger = require('loglevel');
const path = require('path');
const nunjucks = require('nunjucks');

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
    //Standard middleware
    expressMiddlewareInit(app, piCom);
    router.configureRoutes(app);

    errorHandlingMiddleware(app);
}

function expressMiddlewareInit(app, piCom){
    nunjucks.configure('views', {
        autoescape: true,
        express: app
    });

    app.use(helmet());

    // uncomment after placing your favicon in /public
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(morgan('dev', {stream: logger.stream}));
    app.use(bodyParser.json({ extended: true, limit: '25mb' }));
    app.use(bodyParser.urlencoded({extended: false}));
    //Static Files
    app.use(express.static(path.join(__dirname, 'public')));

    //Add piCom to routes
    app.use((req, res, next) => {
        req.piCom = piCom;
        next();
    });
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
