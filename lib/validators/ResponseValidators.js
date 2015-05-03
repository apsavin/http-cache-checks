var CacheableStatusCodes = {
    200: 'OK',
    203: 'Non-Authoritative Information',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    410: 'Gone'
};

/**
 * Invalidates HTTP response codes as stipulated in RFC 2616.
 *
 * @see RFC 2616 Section 13.4.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.statusCodes = function (checker) {
    if (!CacheableStatusCodes[checker.statusCode]) {
        checker.setStorableFlag(false);
        return true;
    }
};

/**
 * Checks if response cache-control states private
 *
 * @see RFC 2616 Section 14.9.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.onlyPrivate = function (checker) {
    if (!checker.storePrivate && /private/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(false);
        return true;
    }
};

/**
 * Checks if response cache-control states no-store
 *
 * @see RFC 2616 Section 14.9.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.noStore = function (checker) {
    if (/no-store(?!=)/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(false);
        return true;
    }
};

/**
 * Checks if response cache-control states max-age=0, disallowing it to be cached.
 *
 * @see RFC 2616 Section 14.9.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.maxAgeZero = function (checker) {
    if (/max-age=(0|-[0-9]+)/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(false);
        return true;
    }
};

/**
 * Checks if response vary states *, disallowing it to be cached.
 *
 * @see RFC 2616 Section 13.6.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.varyAsterisk = function (checker) {
    if (/\*/.test(checker.headers['vary'])) {
        checker.setStorableFlag(false);
        return true;
    }
};

/**
 * Checks if response cache-control states max-age, allowing it to be cached.
 *
 * @see RFC 2616 Section 14.9.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.maxAgeFuture = function (checker) {
    if (/max-age=[0-9]+/.test(checker.headers['cache-control'])) {
        checker.setStorableFlag(true);
    }
};

/**
 * Checks if the weak validator Last-Modified is present in the response.
 *
 * @see RFC 2616 Section 13.3.1.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.lastModified = function (checker) {
    if (typeof checker.headers['last-modified'] !== 'undefined') {
        checker.setStorableFlag(true);
    }
};

/**
 * Checks if the strong validator ETag is present in the response.
 *
 * @see RFC 2616 Section 13.3.2.
 * @param {ResponseChecker} checker
 * @returns {boolean|undefined}
 */
exports.eTag = function (checker) {
    if (typeof checker.headers['etag'] !== 'undefined') {
        checker.setStorableFlag(true);
    }
};
