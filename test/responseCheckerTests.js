var ResponseChecker = require('../lib/checkers/ResponseChecker'),
    assert = require('assert');

describe('ResponseChecker', function () {

    it('is storable if response statusCode is 200, 203, 300, 301 or 410', function () {
        [200, 203, 300, 301, 410].forEach(function (statusCode) {
            var responseChecker = new ResponseChecker({
                statusCode: statusCode,
                headers: {
                    'cache-control': 'max-age=1'
                }
            });
            assert(responseChecker.isStorable());
        });
        var responseChecker = new ResponseChecker({
            statusCode: 404,
            headers: {
                'cache-control': 'max-age=1'
            }
        });
        assert(!responseChecker.isStorable());
    });

    it('is not storable if no headers specified', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200
        });
        assert(!responseChecker.isStorable());
    });

    it('is not storable if cache-control private', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'private',
                'etag': '1'
            }
        });
        assert(!responseChecker.isStorable());
    });

    it('is storable if cache-control private and storePrivate option is true', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'private',
                'etag': '1'
            }
        }, {
            storePrivate: true
        });
        assert(responseChecker.isStorable());
    });

    it('is not storable if response max-age=0', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'max-age=0'
            }
        });
        assert(!responseChecker.isStorable());
    });

    it('is not storable if response vary=*', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'max-age=1',
                'vary': '*'
            }
        });
        assert(!responseChecker.isStorable());
    });

    it('is not storable if cache-control no-store', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'no-store',
                'last-modified': '1231231231'
            }
        });
        assert(!responseChecker.isStorable());
    });

    it('is storable if response max-age>0', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'cache-control': 'max-age=1'
            }
        });
        assert(responseChecker.isStorable());
    });

    it('is storable if valid expires specified', function () {
        var date = new Date(),
            currentDateUTC = date.toUTCString();
        date.setFullYear(date.getFullYear() + 1);
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'date': currentDateUTC,
                'expires': date.toUTCString()
            }
        });
        assert(responseChecker.isStorable());
    });

    it('is storable if last-modified specified', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'last-modified': '1231231231'
            }
        });
        assert(responseChecker.isStorable());
    });

    it('is storable if etag specified', function () {
        var responseChecker = new ResponseChecker({
            statusCode: 200,
            headers: {
                'etag': '1'
            }
        });
        assert(responseChecker.isStorable());
    });
});
