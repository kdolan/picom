exports.configureRoutes = function (app) {

    let ui = require('./ui')();
    let piCom = require('./pi.com')();

    //app.use('/api/v1/path', routeName);
    //app.use('/v1/path', middleware, routeName);

    app.use("/", ui);
    app.use("/v1", piCom);
};