let express = require('express');
let router = express.Router();

module.exports = function() {

    let controller = require('../controller/admin.ui.controller');

    router.get('/',controller.renderAdminUiRoute);

    return router;
};
