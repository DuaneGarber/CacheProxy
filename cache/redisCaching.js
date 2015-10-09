var colors = require('colors');
var redis = require('redis');
var client = redis.createClient({return_buffers: true});
var Cache = require('./cache');

/**
 * Redis Caching
 *
 * Redis Database storage, will persist results
 *
 * Arguments
 * options : Caching Options
 */
var RedisCaching = function (options, dbNum) {
  Cache.call(this, options);
  client.on('ready', function (err) {
    if (err) {
      console.error(colors.red('ERROR: Redis is not READY', err));
    } else {
      console.log(colors.green('Redis Client is ready!'));
    }
  });

  // Specific specific db number (defaults to 0)
  if (dbNum) {
    client.select(dbNum);
  }
  // Fire GC on startup
  this.garbageCollection();
};

RedisCaching.prototype = Object.create(Cache.prototype);

RedisCaching.prototype.insert = function (path, body) {
  client.hmset(path, {
    body: body,
    exp: Date.now() + this.options.cacheDuration
  },
  function (error, cacheObj) {
    if (error) {
      console.error(colors.red('ERROR: Failed to Insert into Redis ', error));
      return false;
    }
    return true;
  });
};

RedisCaching.prototype.find = function (path, cb) {
  return client.hgetall(path, cb);
};

RedisCaching.prototype.remove = function (path) {
  client.del(path,
  function (error, cacheObj) {
    if (error) {
      console.error(colors.red('ERROR: Failed to GET from Redis ', error));
      return false;
    }
    return true;
  });
};
RedisCaching.prototype.garbageCollection = function () {
  var currentTime = Date.now();
  var thisInstance = this;
  client.keys('*',
    function (error, paths) {
      if (error) {
        console.error(colors.red('ERROR: Failed to GET from Redis ', error));
        return false;
      }
      if (paths) {
        var cacheObj = null;
        // Reset the cacheCount on GC
        this.cachedElements = paths.length;
        paths.forEach(function (path) {
          cacheObj = thisInstance.find(path);
          if (cacheObj && (cacheObj.exp < currentTime)) {
            // Delete the entry
            thisInstance.remove(path);
            this.cachedElements--;
          }
        });
      }
    }
  );
};

module.exports = RedisCaching;
