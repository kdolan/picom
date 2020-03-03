let controller = {};
module.exports = controller;

controller.renderAdminUiRoute = function (req, res) {
    res.render('admin.njk', {config: req.piCom.mumbleConfig});
};

