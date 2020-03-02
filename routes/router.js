exports.configureRoutes = function (app, piCom) {

    //app.use('/api/v1/path', routeName);
    //app.use('/v1/path', middleware, routeName);

    app.get('/helloworld', (req, res) => {
        piCom.mumble.sendMessageToCurrentChannel(`Hello World From API. API Says '${req.query.message}'`);
        res.json({status: 'ok'});
    });

    app.get('/status', (req, res) => res.json(
        {
            status: piCom.state,
            mumbleReady: piCom.mumble.connection.ready,
        }));

};