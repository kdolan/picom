let log = require('loglevel');

exports.standardErrorResponse = function(err, res){
    try {
        if (err.code)
            res.status(err.code).json({message: err.message});
        else
            unknownErrorResponse(err, res);
    }
    catch (e) {
        unknownErrorResponse(err, res);
    }
};

function unknownErrorResponse(err, res) {
    log.error(`Unhandled 500 Error: ${err.error || err.message || err}. ${err.stack}`);
    res.status(500).json({ message: "An unexpected error occurred." });
}