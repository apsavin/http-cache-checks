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
    this.storable = undefined; // deliberate

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
StorabilityChecker.prototype.setStorableFlag = function (flag) {
    if (this.storable || typeof this.storable === 'undefined') {
        this.storable = flag;
    }
};

/**
 * @returns {boolean}
 */
StorabilityChecker.prototype.isStorable = function () {
    if (typeof this.storable === 'undefined') {
        this.validators.some(function (validator) {
            return validator(this);
        }, this);
    }

    return !!this.storable;
};

module.exports = StorabilityChecker;
