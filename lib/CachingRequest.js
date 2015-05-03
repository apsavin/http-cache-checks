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
    if (err || !res) {
        this._callback(err, res);
        return;
    }
    this._response = res;
    if (this._response.statusCode === NOT_MODIFIED) {
        this._callback(err, this._responseFromCache);
    } else {
        var callbackCalled = false;
        if (this._requestChecker.isStorable()) {
            var responseChecker = new ResponseChecker(res, this._responseCheckerOptions);
            if (responseChecker.isStorable()) {
                var callback = this._callback;
                this._updateCacheEntries(function () {
                    callback(err, res);
                });
                callbackCalled = true;
            }
        }
        if (!callbackCalled) {
            this._callback(err, res);
        }
    }
};

CachingRequest.prototype._getCurrentTime = function () {
    return Date.now() / 1000
};

CachingRequest.prototype._retrieve = function (callback) {
    this._storage.get(this._requestOptions, callback);
};

CachingRequest.prototype._updateCacheEntries = function (callback) {
    var response = this._response;
    this._storage.set(this._requestOptions, {
        headers: response.headers,
        body: response.body,
        requestTime: this._requestTime,
        responseTime: this._getCurrentTime()
    }, callback);
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
