var isCacheEntryFresh = require('../checkers/CacheEntryChecker').isFresh;

var HttpCacheStorage = function (options) {
    this._storage = options.storage;
    this.normalize = options.normalize || this.normalize;
};

HttpCacheStorage.prototype.get = function (requestOptions, callback) {
    var self = this;
    this._getVary(requestOptions, function (err, vary) {
        if (err || !vary) {
            return callback(err);
        }
        var entryKey = self._makeEntryKey(requestOptions, vary);
        self._storage.get(entryKey, function (err, cacheEntry) {
            if (err || !cacheEntry) {
                return callback(err);
            }
            var isFresh = isCacheEntryFresh(cacheEntry);
            if (!isFresh && !cacheEntry.headers['last-modified'] && !cacheEntry.headers['etag']) {
                self._storage.del(entryKey);
                return callback();
            }
            callback(err, cacheEntry, isFresh);
        });
    });
};

HttpCacheStorage.prototype._getVary = function (requestOptions, callback) {
    this._storage.get(this._makeVaryKey(requestOptions), callback);
};

HttpCacheStorage.prototype._makeVaryKey = function (requestOptions) {
    return 'vary ' + (requestOptions.headers.host || '') + requestOptions.url;
};

HttpCacheStorage.prototype._makeEntryKey = function (requestOptions, vary) {
    var self = this;
    return 'entry ' +
        (requestOptions.headers.host || '') + requestOptions.url +
        (vary || []).reduce(function (str, headerName) {
            return self.normalize(headerName, requestOptions.headers[headerName], requestOptions);
        }, '');
};

/**
 * @param {string} headerName
 * @param {string} headerValue
 * @param {object} requestOptions
 * @returns {string}
 */
HttpCacheStorage.prototype.normalize = function (headerName, headerValue, requestOptions) {
    return headerValue;
};

HttpCacheStorage.prototype.set = function (requestOptions, response, callback) {
    var vary = this._makeVary(response),
        varyKey = this._makeVaryKey(requestOptions),
        self = this;

    this._storage.set(varyKey, vary, function (err) {
        if (err) {
            return callback(err);
        }
        self._storage.set(self._makeEntryKey(requestOptions, vary), response, callback);
    });
};

/**
 * @param {object} response
 * @returns {Array.<string>}
 * @private
 */
HttpCacheStorage.prototype._makeVary = function (response) {
    if (!response.headers.vary) {
        return [];
    }
    return response.headers.vary.split(',').map(function (header) {
        return header.trim().toLowerCase();
    });
};

module.exports = HttpCacheStorage;
