/**
 * Make the request cacheable if the method is GET or HEAD.
 * Anything else is uncacheable.
 *
 * @see RFC 2616 Section 13.9.
 * @param {RequestChecker} checker
 * @returns {boolean}
 */
exports.methodGetOrHead = function (checker) {
    var flag = (checker.method === 'GET' || checker.method === 'HEAD');
    checker.setStorableFlag(flag);
    checker.setRetrievableFlag(flag);
    return !flag;
};

/**
 * Checks if the request's max-age is zero, rendering it uncacheable.
 *
 * @see RFC 2616 Section 13.1.6.
 * @param {RequestChecker} checker
 * @returns {boolean|undefined}
 */
exports.maxAgeZero = function (checker) {
    if (/max-age=(0|-[0-9]+)/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(true);
        checker.setRetrievableFlag(false);
    }
};

/**
 * Checks if request cache-control/pragma states no-cache.
 *
 * @see RFC 2616 Section 14.9.
 * @param {RequestChecker} checker
 * @returns {boolean|undefined}
 */
exports.noCache = function (checker) {
    if (/no-cache/.test(checker.headers['cache-control']) || checker.headers['pragma'] === 'no-cache') {
        checker.setStorableFlag(false);
        checker.setRetrievableFlag(false);
        return true;
    }
};

/**
 * Checks if request cache-control states no-cache, rendering it uncacheable.
 *
 * @see RFC 2616 Section 14.9.
 * @param {RequestChecker} checker
 * @returns {boolean|undefined}
 */
exports.noStore = function (checker) {
    if (/no-store/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(false);
        checker.setRetrievableFlag(false);
        return true;
    }
};
