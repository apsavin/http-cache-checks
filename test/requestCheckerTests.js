var RequestChecker = require('../lib/checkers/RequestChecker'),
    assert = require('assert');

describe('RequestChecker', function () {

    it('is storable and retrievable if request is GET or HEAD and no headers specified', function () {
        ['GET', 'HEAD', 'get', 'head'].forEach(function (method) {
            var requestChecker = new RequestChecker({
                method: method
            });
            assert(requestChecker.isStorable());
            assert(requestChecker.isRetrievable());
        });
    });

    it('is storable but not retrievable if request is GET and max-age=0', function () {
        var requestChecker = new RequestChecker({
            method: 'get',
            headers: {
                'cache-control': 'max-age=0'
            }
        });
        assert(!requestChecker.isRetrievable());
        assert(requestChecker.isStorable());
    });

    it('is not storable and not retrievable if request is POST, PUT or DELETE', function () {
        ['POST', 'PUT', 'DELETE'].forEach(function (method) {
            var requestChecker = new RequestChecker({
                method: method
            });
            assert(!requestChecker.isStorable());
            assert(!requestChecker.isRetrievable());
        });
    });

    it('is not storable and not retrievable if request is GET/HEAD and cache-control=no-cache', function () {
        ['GET', 'HEAD'].forEach(function (method) {
            var requestChecker = new RequestChecker({
                method: method,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            assert(!requestChecker.isStorable());
            assert(!requestChecker.isRetrievable());
        });
    });

    it('is not storable and not retrievable if request is GET/HEAD and pragma=no-cache', function () {
        ['GET', 'HEAD'].forEach(function (method) {
            var requestChecker = new RequestChecker({
                method: method,
                headers: {
                    'pragma': 'no-cache'
                }
            });
            assert(!requestChecker.isStorable());
            assert(!requestChecker.isRetrievable());
        });
    });

    it('is not storable and not retrievable if request is GET/HEAD and cache-control=no-store', function () {
        ['GET', 'HEAD'].forEach(function (method) {
            var requestChecker = new RequestChecker({
                method: method,
                headers: {
                    'cache-control': 'no-store'
                }
            });
            assert(!requestChecker.isStorable());
            assert(!requestChecker.isRetrievable());
        });
    });
});
