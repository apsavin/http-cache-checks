var CachingRequest = require('./TestCachingRequest'),
    assert = require('assert'),
    MemoryStorage = require('../lib/storages/MemoryStorage'),
    memoryStorage = new MemoryStorage();

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
    });

});
