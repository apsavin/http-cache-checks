var getCurrentTime = require('../currentDate').getCurrentDateSeconds;

var parseDateFromHeader = function (entry, headerName) {
    return new Date(entry.headers[headerName]) / 1000;
};

/**
 * @see RFC 2616 13.2.3
 * @returns {number}
 * @private
 */
var getCurrentAge = function (entry) {
    var ageValue = getAgeValue(entry),
        dateValue = getDateValue(entry),
        requestTime = entry.requestTime,
        responseTime = entry.responseTime,
        now = getCurrentTime(),
        apparentAge = Math.max(0, responseTime - dateValue),
        correctedReceivedAge = Math.max(apparentAge, ageValue),
        responseDelay = responseTime - requestTime,
        correctedInitialAge = correctedReceivedAge + responseDelay,
        residentTime = now - responseTime;
    return correctedInitialAge + residentTime;
};

var getAgeValue = function (entry) {
    return parseInt(entry.headers['age']) || 0;
};

var getDateValue = function (entry) {
    return parseDateFromHeader(entry, 'date');
};

var getMaxAgeValue = function (entry) {
    var maxAgeParts = /max-age=(\d+)/.exec(entry.headers['cache-control']);
    return maxAgeParts ? parseInt(maxAgeParts[1], 10) : 0;
};

var getExpiresValue = function (entry) {
    return parseDateFromHeader(entry, 'expires');
};

/**
 * @see RFC 2616 13.2.4
 * @returns {boolean}
 */
exports.isFresh = function (entry) {
    var freshnessLifetime = getMaxAgeValue(entry) || getExpiresValue(entry) - getDateValue(entry);
    return freshnessLifetime > getCurrentAge(entry);
};
