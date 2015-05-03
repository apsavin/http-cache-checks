var HttpCacheStorage = require('./HttpCacheStorage'),
    util = require('util'),
    LruCache = require("lru-cache");

var LruStorage = function (options) {
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

LruStorage.prototype.set = function (key, value, cb) {
    this._lruCache.set(key, value);
    if (cb) {
        process.nextTick(cb);
    }
    return this;
};

LruStorage.prototype.get = function (key, cb) {
    var value = this._lruCache.get(key);
    process.nextTick(function () {
        cb(null, value);
    });
    return this;
};

LruStorage.prototype.del = function (key, cb) {
    this._lruCache.del(key);
    if (cb) {
        process.nextTick(cb);
    }
    return this;
};

var MemoryStorage = function (options) {
    options = options || {};
    options.storage = options.storage || new LruStorage();
    HttpCacheStorage.call(this, options);
};

util.inherits(MemoryStorage, HttpCacheStorage);

module.exports = MemoryStorage;
