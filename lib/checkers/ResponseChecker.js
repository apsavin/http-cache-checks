var StorabilityChecker = require('./StorabilityChecker'),
    util = require('util'),
    validators = require('../validators/Validators').responseValidators;

/**
 * @constructs
 * @extends StorabilityChecker
 */
function ResponseChecker (res, options) {
    options = options || {};
    options.validators = options.validators || validators;
    StorabilityChecker.call(this, res.headers, options);

    /**
     * @type {boolean}
     */
    this.storePrivate = !!options.storePrivate;

    /**
     * The HTTP status code indicated in the response
     * @type {number}
     */
    this.statusCode = res.statusCode;
}

util.inherits(ResponseChecker, StorabilityChecker);

module.exports = ResponseChecker;
