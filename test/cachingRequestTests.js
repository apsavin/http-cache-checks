var CachingRequest = require('./TestCachingRequest'),
    assert = require('assert'),
    HttpCacheStorage = require('../lib/storages/HttpCacheStorage'),
    AsyncLruCache = require('../lib/storages/AsyncLruCache'),
    memoryStorage = new HttpCacheStorage({
        storage: new AsyncLruCache()
    });

describe('CachingRequest', function () {

    describe('constructor', function () {
        it('throws if there were no options', function () {
            assert.throws(function () {
                new CachingRequest();
            }, /CachingRequest must be called with options/);
        });
        it('throws if there were no requestOptions', function () {
            assert.throws(function () {
                new CachingRequest({});
            }, /CachingRequest needs requestOptions/);
        });
        it('throws if there were no storage', function () {
            assert.throws(function () {
                new CachingRequest({
                    requestOptions: {}
                });
            }, /CachingRequest needs a storage/);
        });
        it('throws if there were no callback', function () {
            assert.throws(function () {
                new CachingRequest({
                    requestOptions: {},
                    storage: {}
                });
            }, /CachingRequest needs a callback/);
        });
    });

    describe('#send', function () {
        it('sends requests', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla',
                        method: 'GET'
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.deepEqual(res, response);
                        done();
                    }
                }),
                response = {
                    body: 'bla',
                    statusCode: 200,
                    headers: {
                        date: (new Date()).toUTCString(),
                        'cache-control': 'max-age=1'
                    }
                };
            request.setResponse(response);
            request.send();
        });
        it('caches requests', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla',
                        method: 'GET'
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.equal(res.body, 'bla');
                        done();
                    }
                }),
                response = {
                    body: 'not bla'
                };
            request.setResponse(response);
            request.send();
        });
        it('not returns from cache expired responses', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla',
                        method: 'GET'
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.equal(res.body, 'not bla');
                        done();
                    }
                }),
                response = {
                    body: 'not bla',
                    statusCode: 200,
                    headers: {
                        date: (new Date()).toUTCString(),
                        'cache-control': 'max-age=1'
                    }
                };
            request.setResponse(response);
            setTimeout(function () {
                request.send();
            }, 1000)
        });
        it('sends request with conditional headers if cache entry has etag or last-modified headers', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla2',
                        method: 'GET'
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.deepEqual(res, response);
                        var secondRequest = new CachingRequest({
                                requestOptions: {
                                    url: '/bla2',
                                    method: 'GET'
                                },
                                storage: memoryStorage,
                                callback: function (err, res) {
                                    assert.equal(err, null);
                                    assert.equal(res.body, 'bla');
                                    var requestHeaders = secondRequest.getRequestHeaders();
                                    assert.equal(requestHeaders['if-modified-since'], lastModified);
                                    assert.equal(requestHeaders['if-none-match'], etag);
                                    done();
                                }
                            }),
                            secondResponse = {
                                statusCode: 304,
                                headers: {
                                    date: (new Date()).toUTCString(),
                                    'last-modified': lastModified,
                                    etag: etag
                                }
                            };
                        secondRequest.setResponse(secondResponse);
                        secondRequest.send();
                    }
                }),
                lastModified = (new Date()).toUTCString(),
                etag = '1',
                response = {
                    body: 'bla',
                    statusCode: 200,
                    headers: {
                        date: (new Date()).toUTCString(),
                        'last-modified': lastModified,
                        etag: etag
                    }
                };
            request.setResponse(response);
            request.send();
        });
        it('honors vary header', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla3',
                        method: 'GET',
                        headers: {
                            'accept-encoding': 'gzip'
                        }
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.deepEqual(res, response);
                        var secondRequest = new CachingRequest({
                                requestOptions: {
                                    url: '/bla3',
                                    method: 'GET',
                                    headers: {
                                        'accept-encoding': 'deflate'
                                    }
                                },
                                storage: memoryStorage,
                                callback: function (err, res) {
                                    assert.equal(err, null);
                                    assert.equal(res, secondResponse);
                                    var thirdRequest = new CachingRequest({
                                        requestOptions: {
                                            url: '/bla3',
                                            method: 'GET',
                                            headers: {
                                                'accept-encoding': 'gzip'
                                            }
                                        },
                                        storage: memoryStorage,
                                        callback: function (err, res) {
                                            assert.equal(err, null);
                                            assert.equal(res.body, 'blagzip');
                                            done();
                                        }
                                    });
                                    thirdRequest.send();
                                }
                            }),
                            secondResponse = {
                                body: 'bladeflate',
                                statusCode: 200,
                                headers: {
                                    date: (new Date()).toUTCString(),
                                    'cache-control': 'max-age=3',
                                    vary: 'Accept-Encoding'
                                }
                            };
                        secondRequest.setResponse(secondResponse);
                        secondRequest.send();
                    }
                }),
                response = {
                    body: 'blagzip',
                    statusCode: 200,
                    headers: {
                        date: (new Date()).toUTCString(),
                        'cache-control': 'max-age=3',
                        vary: 'Accept-Encoding'
                    }
                };
            request.setResponse(response);
            request.send();
        });
        it('removes 1* warning headers but retains 2* warning headers, other end-to-end headers gets from last response', function (done) {
            var request = new CachingRequest({
                    requestOptions: {
                        url: '/bla4',
                        method: 'GET'
                    },
                    storage: memoryStorage,
                    callback: function (err, res) {
                        assert.equal(err, null);
                        assert.deepEqual(res, response);
                        var secondRequest = new CachingRequest({
                                requestOptions: {
                                    url: '/bla4',
                                    method: 'GET'
                                },
                                storage: memoryStorage,
                                callback: function (err, res) {
                                    assert.equal(err, null);
                                    assert.equal(res.body, 'bla');
                                    var requestHeaders = secondRequest.getRequestHeaders();
                                    assert.equal(requestHeaders['if-modified-since'], lastModified);
                                    assert.equal(requestHeaders['if-none-match'], etag);
                                    assert.equal(res.headers['warning'].length, 1);
                                    assert.equal(res.headers['warning'][0], warning[1]);
                                    assert.equal(res.headers['server'], secondResponse.headers['server']);
                                    assert.equal(res.headers['connection'], response.headers['connection']);
                                    done();
                                }
                            }),
                            secondResponse = {
                                statusCode: 304,
                                headers: {
                                    date: (new Date()).toUTCString(),
                                    'last-modified': lastModified,
                                    etag: etag,
                                    server: 'CERN/3.1 libwww/2.17'
                                }
                            };
                        secondRequest.setResponse(secondResponse);
                        secondRequest.send();
                    }
                }),
                lastModified = (new Date()).toUTCString(),
                etag = '1',
                warning = [
                    '110 Response is stale',
                    '299 Miscellaneous persistent warning'
                ],
                response = {
                    body: 'bla',
                    statusCode: 200,
                    headers: {
                        date: (new Date()).toUTCString(),
                        'last-modified': lastModified,
                        etag: etag,
                        warning: warning,
                        server: 'CERN/3.0 libwww/2.17',
                        connection: 'close'
                    }
                };
            request.setResponse(response);
            request.send();
        });
    });

});
