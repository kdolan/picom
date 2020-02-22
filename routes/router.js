exports.configureRoutes = function (app, mumble) {

    //app.use('/api/v1/path', routeName);
    //app.use('/v1/path', middleware, routeName);

    app.get('/helloworld', (req, res) => {
        mumble.sendMessageToCurrentChannel(`Hello World From API. API Says '${req.query.message}'`);
        res.json({status: 'ok'});
    });

    app.get('/health', (req, res) => res.json({status: 'ok', mumbleReady: mumble.connection.ready}));

};