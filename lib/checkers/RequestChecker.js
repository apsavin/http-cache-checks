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
    this._retrievable = undefined; // deliberate
}

util.inherits(RequestChecker, StorabilityChecker);

RequestChecker.prototype._needToStopValidation = function () {
    return StorabilityChecker.prototype._needToStopValidation.call(this) && this._retrievable === false;
};

RequestChecker.prototype._applyValidationResult = function (result) {
    StorabilityChecker.prototype._applyValidationResult.call(this, result);
    this._setRetrievableFlag(result.retrievable);
};

/**
 * @param {boolean} flag
 */
RequestChecker.prototype._setRetrievableFlag = function (flag) {
    if (this._retrievable !== false) {
        this._retrievable = flag;
    }
};

/**
 * @returns {boolean}
 */
RequestChecker.prototype.isRetrievable = function () {
    if (typeof this._retrievable === 'undefined') {
        this._validate();
    }
    return this._retrievable;
};

module.exports = RequestChecker;
