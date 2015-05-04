/**
 * @constructs
 */
function StorabilityChecker (headers, options) {
    options = options || {};

    /**
     * @type {Array.<function>}
     */
    this.validators = Array.isArray(options.validators) ? options.validators : [];

    /**
     * @type {Object.<string>}
     */
    this.headers = {};

    /**
     * @type {boolean|undefined}
     */
    this._storable = undefined; // deliberate

    if (headers) {
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                this.headers[key.toLowerCase()] = headers[key];
            }
        }
    }
}

/**
 * @param {boolean} flag
 */
StorabilityChecker.prototype._setStorableFlag = function (flag) {
    if (this._storable !== false) {
        this._storable = flag;
    }
};

/**
 * @returns {boolean}
 */
StorabilityChecker.prototype.isStorable = function () {
    if (typeof this._storable === 'undefined') {
        this._validate();
    }

    return !!this._storable;
};

StorabilityChecker.prototype._validate = function () {
    this.validators.some(this._runValidator, this);
};

StorabilityChecker.prototype._runValidator = function (validator) {
    var result = validator(this);
    if (result) {
        this._applyValidationResult(result);
        return this._needToStopValidation();
    }
};

StorabilityChecker.prototype._applyValidationResult = function (result) {
    this._setStorableFlag(result.storable);
};

StorabilityChecker.prototype._needToStopValidation = function () {
    return this._storable === false;
};

module.exports = StorabilityChecker;
