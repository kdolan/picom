let express = require('express');
//var favicon = require('serve-favicon');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let helmet = require('helmet');
let logger = require('loglevel');

let router = require('./routes/router');

const MumbleServiceClient = require('./service/MumbleClientService').MumbleClientService;

async function initMumbleClient() {
    const config = require('./config/mumble');
    const client = new MumbleServiceClient(config);
    await client.connect();
    return client;
}

//Starts the application given the db and returns the express app
async function startApp(app, client) {
    const ch = await client.joinChannel("Landing Channel");
    client.sendMessageToCurrentChannel("Test");

    //Standard middleware
    expressMiddlewareInit(app);
    router.configureRoutes(app, client);

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
        const cleint = await initMumbleClient();
        await startApp(app, cleint);
        callback(app);
}

//Return the express app.
module.exports.initApp = initApp;
