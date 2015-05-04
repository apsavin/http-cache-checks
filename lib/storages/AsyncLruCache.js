var LruCache = require("lru-cache");

var AsyncLruCache = function (options) {
    options = options || {};
    var ttl = options.ttl;
    var lruOptions = {
        max: options.max || 500,
        maxAge: ttl ? ttl * 1000 : null,
        dispose: options.dispose,
        length: options.length,
        stale: options.stale
    };

    this._lruCache = new LruCache(lruOptions);
};

AsyncLruCache.prototype.set = function (key, value, cb) {
    this._lruCache.set(key, value);
    if (cb) {
        process.nextTick(cb);
    }
    return this;
};

AsyncLruCache.prototype.get = function (key, cb) {
    var value = this._lruCache.get(key);
    process.nextTick(function () {
        cb(null, value);
    });
    return this;
};

AsyncLruCache.prototype.del = function (key, cb) {
    this._lruCache.del(key);
    if (cb) {
        process.nextTick(cb);
    }
    return this;
};

module.exports = AsyncLruCache;
