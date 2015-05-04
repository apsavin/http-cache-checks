var RequestChecker = require('./checkers/RequestChecker'),
    ResponseChecker = require('./checkers/ResponseChecker');

var NOT_MODIFIED = 304;

/**
 * @param options
 * @param options.requestOptions
 * @param options.requestCheckerOptions
 * @param options.responseCheckerOptions
 * @param options.storage
 * @param options.callback
 * @constructs
 */
var CachingRequest = function (options) {
    if (!options) {
        throw new Error('CachingRequest must be called with options');
    }
    if (!options.requestOptions) {
        throw new Error('CachingRequest needs requestOptions');
    }
    if (!options.storage) {
        throw new Error('CachingRequest needs a storage');
    }
    if (!options.callback) {
        throw new Error('CachingRequest needs a callback');
    }
    this._onResponse = this._onResponse.bind(this);
    this._onRetrieve = this._onRetrieve.bind(this);
    this._requestChecker = new RequestChecker(options.requestOptions, options.requestCheckerOptions);
    this._requestOptions = options.requestOptions;
    this._requestOptions.headers = this._requestChecker.headers;
    this._callback = options.callback;
    this._responseCheckerOptions = options.responseCheckerOptions;
    this._storage = options.storage;
};

CachingRequest.prototype.send = function () {
    // we should always try to retrieve response
    // even if we can't use cached entries (request is not retrievable)
    // we can build conditional headers for request at least
    this._retrieve(this._onRetrieve);
    return this;
};

CachingRequest.prototype._send = function (requestOptions, callback) {
};

CachingRequest.prototype._onRetrieve = function (error, response, isFresh) {
    if (!error && response) {
        if (isFresh && this._requestChecker.isRetrievable()) {
            return this._callback(error, response);
        } else {
            this._addConditionalHeaders(response);
        }
    }
    this._requestTime = this._getCurrentTime();
    this._responseFromCache = response;
    this._send(this._requestOptions, this._onResponse);
};

CachingRequest.prototype._onResponse = function (err, res) {
    var callback = this._callback;
    if (err || !res) {
        callback(err, res);
        return;
    }
    this._response = res;
    if (this._response.statusCode === NOT_MODIFIED) {
        this._updateCacheEntry(function (err, entry) {
            callback(err, entry);
        });
        return;
    }
    var callbackCalled = false;
    if (this._requestChecker.isStorable()) {
        var responseChecker = new ResponseChecker(res, this._responseCheckerOptions);
        if (responseChecker.isStorable()) {
            this._updateCacheEntry(function () {
                callback(err, res);
            });
            callbackCalled = true;
        }
    }
    if (!callbackCalled) {
        callback(err, res);
    }
};

CachingRequest.prototype._getCurrentTime = function () {
    return Date.now() / 1000
};

CachingRequest.prototype._retrieve = function (callback) {
    this._storage.get(this._requestOptions, callback);
};

/**
 * @see RFC 2616 13.5.1
 * @type {Object.<boolean>}
 */
var hopByHopHeaders = {
    'connection': true,
    'keep-alive': true,
    'proxy-authenticate': true,
    'proxy-authorization': true,
    'te': true,
    'trailers': true,
    'transfer-encoding': true,
    'upgrade': true
};

/**
 * @see RFC 2616 13.5.3
 */
CachingRequest.prototype._updateCacheEntryHeaders = function () {
    var warningsFromCache = this._responseFromCache.headers['warning'],
        warningsFromResponse = this._response.headers['warnings'],
        newWarnings;
    for (var headerName in this._response.headers) {
        if (this._response.headers.hasOwnProperty(headerName)) {
            if (hopByHopHeaders[headerName]) {
                continue;
            }
            this._responseFromCache.headers[headerName] = this._response.headers[headerName];
        }
    }
    if (warningsFromCache) {
        warningsFromCache = typeof warningsFromCache === 'string' ? [warningsFromCache] : warningsFromCache;
        warningsFromResponse = typeof warningsFromResponse === 'string' ? [warningsFromResponse] : warningsFromResponse;
        newWarnings = warningsFromResponse ? warningsFromResponse.concat([]) : [];
        newWarnings = newWarnings.concat(warningsFromCache.filter(function (warning) {
            return /^2/.test(warning);
        }));
        this._responseFromCache.headers['warning'] = newWarnings;
    }
};

CachingRequest.prototype._updateCacheEntry = function (callback) {
    var response = this._response,
        entry;
    if (this._responseFromCache) {
        this._updateCacheEntryHeaders();
        entry = this._responseFromCache;
    } else {
        entry = {
            headers: response.headers,
            body: response.body,
            requestTime: this._requestTime,
            responseTime: this._getCurrentTime()
        };
    }
    this._storage.set(this._requestOptions, entry, function (err) {
        callback(err, entry);
    });
};

/**
 * @see RFC 2616 14.25, 14.26
 * @param {object} response
 * @private
 */
CachingRequest.prototype._addConditionalHeaders = function (response) {
    if (response.headers['last-modified']) {
        this._requestOptions.headers['if-modified-since'] = response.headers['last-modified'];
    }
    if (response.headers['etag']) {
        this._requestOptions.headers['if-none-match'] = response.headers['etag'];
    }
};

module.exports = CachingRequest;
