exports.configureRoutes = function (app, piCom) {

    //app.use('/api/v1/path', routeName);
    //app.use('/v1/path', middleware, routeName);

    //TODO These are temp routes to be moved to controllers and routers
    app.get('/helloworld', (req, res) => {
        piCom.mumble.sendMessageToCurrentChannel(`Hello World From API. API Says '${req.query.message}'`);
        res.json({status: 'ok'});
    });

    app.get('/status', (req, res) => res.json(
        {
            status: piCom.state,
            mumbleReady: piCom.mumble.connection.ready,
        }));

    //TODO Not get
    app.get('/unlatch', (req, res) => {
        piCom.unLatchMic();
        res.json(
            {
                status: piCom.state,
                mumbleReady: piCom.mumble.connection.ready,
            });
    });

};