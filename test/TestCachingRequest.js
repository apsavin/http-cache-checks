var CachingRequest = require('../lib/CachingRequest'),
    util = require('util');

var TestCachingRequest = function (options) {
    CachingRequest.call(this, options);
    this._error = null;
    this._response = null;
};

util.inherits(TestCachingRequest, CachingRequest);

TestCachingRequest.prototype._send = function (requestOptions, callback) {
    var error = this._error,
        response = this._response;
    process.nextTick(function () {
        callback(error, response);
    });
};

TestCachingRequest.prototype.setResponse = function (response) {
    this._response = response;
    return this;
};

TestCachingRequest.prototype.getRequestHeaders = function () {
    return this._requestOptions.headers;
};

module.exports = TestCachingRequest;
