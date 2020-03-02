class ErrorWithStatusCode extends Error {
    constructor({code = 500, message="Error"},...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorWithStatusCode);
        }

        // Custom debugging information
        this.code = code;
        this.message = message;
        this.date = new Date();
    }
}

module.exports.ErrorWithStatusCode = ErrorWithStatusCode;