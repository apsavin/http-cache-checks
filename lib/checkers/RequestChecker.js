var StorabilityChecker = require('./StorabilityChecker'),
    util = require('util'),
    validators = require('../validators/Validators').requestValidators;

/**
 * @class RequestChecker
 * @extends StorabilityChecker
 * @constructs
 */
function RequestChecker (req, options) {
    options = options || {};
    options.validators = options.validators || validators;
    StorabilityChecker.call(this, req.headers, options);

    /**
     * The request method
     * @type {string}
     */
    this.method = req.method.toUpperCase();

    /**
     * @type {boolean|undefined}
     */
    this.retrievable = undefined; // deliberate
}

util.inherits(RequestChecker, StorabilityChecker);

/**
 * @param {boolean} flag
 */
RequestChecker.prototype.setRetrievableFlag = function (flag) {
    if (this.retrievable || typeof this.retrievable === 'undefined') {
        this.retrievable = flag;
    }
};

/**
 * @returns {boolean}
 */
RequestChecker.prototype.isRetrievable = function () {
    if (typeof this.retrievable === 'undefined') {
        this.validators.some(function (validator) {
            return validator(this);
        }, this);
    }
    return this.retrievable;
};

module.exports = RequestChecker;
