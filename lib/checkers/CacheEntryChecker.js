var CacheEntryChecker = function () {
};

/**
 * @see RFC 2616 13.2.3
 * @returns {number}
 * @private
 */
CacheEntryChecker.prototype._getCurrentAge = function () {
    var entry = this._entry,
        ageValue = this._getAgeValue(),
        dateValue = this._getDateValue(),
        requestTime = entry.requestTime,
        responseTime = entry.responseTime,
        now = this._getCurrentTime(),
        apparentAge = Math.max(0, responseTime - dateValue),
        correctedReceivedAge = Math.max(apparentAge, ageValue),
        responseDelay = responseTime - requestTime,
        correctedInitialAge = correctedReceivedAge + responseDelay,
        residentTime = now - responseTime;
    return correctedInitialAge + residentTime;
};

CacheEntryChecker.prototype._getAgeValue = function () {
    return this._entry.headers['age'] || 0;
};

CacheEntryChecker.prototype._getDateValue = function () {
    return new Date(this._entry.headers['date']) / 1000;
};

CacheEntryChecker.prototype._getMaxAgeValue = function () {
    var maxAgeParts = /max-age=(\d+)/.exec(this._entry.headers['cache-control']);
    return maxAgeParts ? parseInt(maxAgeParts[1], 10) : 0;
};

CacheEntryChecker.prototype._getExpiresValue = function () {
    return parseInt(this._entry.headers['expires'], 10) || 0;
};

CacheEntryChecker.prototype._getCurrentTime = function () {
    return Date.now() / 1000;
};

/**
 * @see RFC 2616 13.2.4
 * @returns {boolean}
 */
CacheEntryChecker.prototype.isFresh = function (entry) {
    this._entry = entry;
    var freshnessLifetime = this._getMaxAgeValue() || this._getExpiresValue() - this._getDateValue();
    return freshnessLifetime > this._getCurrentAge();
};

exports.CacheEntryChecker = CacheEntryChecker;

var cacheEntryChecker = new CacheEntryChecker();

exports.isFresh = function (entry) {
    return cacheEntryChecker.isFresh(entry);
};
