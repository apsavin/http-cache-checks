/**
 * Make the request cacheable if the method is GET or HEAD.
 * Anything else is uncacheable.
 *
 * @see RFC 2616 Section 13.9.
 * @param {RequestChecker} checker
 * @returns {{storable: boolean, retrievable: boolean}}
 */
exports.methodGetOrHead = function (checker) {
    var flag = (checker.method === 'GET' || checker.method === 'HEAD');
    return {
        storable: flag,
        retrievable: flag
    };
};

/**
 * Checks if the request's max-age is zero, rendering it uncacheable.
 *
 * @see RFC 2616 Section 13.1.6.
 * @param {RequestChecker} checker
 * @returns {{storable: boolean, retrievable: boolean}|undefined}
 */
exports.maxAgeZero = function (checker) {
    if (/max-age=(0|-[0-9]+)/.test(checker.headers['cache-control'])) {
        return {
            storable: true,
            retrievable: false
        };
    }
};

/**
 * Checks if request cache-control/pragma states no-cache.
 *
 * @see RFC 2616 Section 14.9.
 * @param {RequestChecker} checker
 * @returns {{storable: boolean, retrievable: boolean}|undefined}
 */
exports.noCache = function (checker) {
    if (/no-cache/.test(checker.headers['cache-control']) || checker.headers['pragma'] === 'no-cache') {
        return {
            storable: false,
            retrievable: false
        };
    }
};

/**
 * Checks if request cache-control states no-cache, rendering it uncacheable.
 *
 * @see RFC 2616 Section 14.9.
 * @param {RequestChecker} checker
 * @returns {{storable: boolean, retrievable: boolean}|undefined}
 */
exports.noStore = function (checker) {
    if (/no-store/.test(checker.headers['cache-control'])) {
        return {
            storable: false,
            retrievable: false
        };
    }
};
