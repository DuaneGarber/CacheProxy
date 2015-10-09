var Cache = require('./cache');

/**
 * Memory Caching
 *
 * Simply JS Object storage, will not survive server stop/restart
 *
 * Arguments
 * options : Caching Options
 */
var MemoryCaching = function (options) {
  Cache.call(this, options);

  // Initialize the in memory Cache
  this.memCache = {};
};

MemoryCaching.prototype = Object.create(Cache.prototype);

MemoryCaching.prototype.insert = function (path, body) {
  this.memCache[path] = {
    body: body,
    exp: Date.now() + this.options.cacheDuration
  };
};

MemoryCaching.prototype.find = function (path, cb) {
  return cb(null, this.memCache[path] || false);
};

MemoryCaching.prototype.remove = function (path) {
  delete this.memCache[path];
};

MemoryCaching.prototype.garbageCollection = function () {
  var currentTime = Date.now();
  for (var key in this.memCache) {
    if (this.memCache.hasOwnProperty(key)) {
      if (this.memCache[key] && this.memCache[key].exp < currentTime) {
        // Delete the entry
        this.remove(key);
      }
    }
  }
};

module.exports = MemoryCaching;
