var colors = require('colors');

/**
 * Cache Base Obj
 *
 * Provides the core functionality to the caching, abstracts the storage and manipulation to
 * children on the Prototype chain.
 *
 * To add a new method of storage, you must override the 3 'interface' methods below:
 * Insert, Find, and Remove
 *
 * Arguments
 * options : Caching Options
 */
var Cache = function (options) {
  // Ensure default values are set
  options.cacheDuration = options.cacheDuration || 60000;
  options.cacheSizeBytes = options.cacheSizeBytes || 50000;
  options.cacheSizeElements = options.cacheSizeElements || 50;

  this.options = options;
  this.cachedElements = 0;

  // Execute Garbage Collection every 60 seconds
  setInterval(function () {
    console.log(colors.cyan('---------- Garbage Collection ----------'));
    this.garbageCollection();
  }.bind(this), 60000);
};

/**
 * Basic Cache Object Getter
 *
 * Arguments
 * path : The requested relative URL of the request
 * cb   : callback function specifying what to do with the data
 *
 * Return
 * cachedObj : If found in the store
 * false : If not found or Error Occurred
 */
Cache.prototype.get = function (path, cb) {
  if (!path) {
    missingPath();
    return cb(null, false);
  }

  return this.find(path, function (error, cacheObj) {
    if (error) {
      return cb(error);
    }

    if (!cacheObj) {
      return cb(null, false);
    }

    // 2 Options: cache is fresh/stale
    if (Date.now() < cacheObj.exp) {
      console.log(colors.magenta('Returning Cached Response for ' + path));
      return cb(null, cacheObj.body);
    }

    this.expire(path);
    return cb(null, false);
  }.bind(this));
};

/**
 * Expire the cache object
 *
 * Arguments
 * path : The requested relative URL of the request
 *
 * Return
 * true : If found expiration was successful
 * false : If expiration failed or Error Occurred
 */
Cache.prototype.expire = function (path) {
  if (!path) {
    return missingPath();
  }

  console.log(colors.yellow('Attempted to retreive cache, but it has expired for ' + path));

  // Decrement Cache Count
  this.cachedElements--;

  // Otherwise cache is expired
  return this.remove(path);
};

/**
 * Expire the cache object
 *
 * Arguments
 * path : The requested relative URL of the request
 * body : The actual body of the request
 * size : The byte size of the both
 *
 * Return
 * true : If found storage was successful
 * false : If storage failed or Error Occurred
 */
Cache.prototype.store = function (path, body, size) {
  if (!path) {
    return missingPath();
  }

  if (!body || !size) {
    console.log(colors.red('ERROR: Attempted to Store, but body or size was missing.'));
    return false;
  }

  if (this.cachedElements >= this.options.cacheSizeElements) {
    console.log(colors.yellow('Attempted to store ' + path + ' but the cache is full'));
    return false;
  }

  if (size <= this.options.cacheSizeBytes) {
    this.insert(path, body);
    console.log(colors.green(path + ' has been cached'));
    // Increment Cache Count
    this.cachedElements++;
    return true;
  }

  console.log(colors.yellow('Attempted to store ' + path + ' but the body size was too big'));

  return false;
};

// Interface Methods -- Not Implemented on base object
Cache.prototype.insert = function (path, body) {
  console.error(colors.red('ERROR: Insert Not implemented on Base Object'));
  return false;
};

Cache.prototype.find = function (path) {
  console.error(colors.red('ERROR: Find Not implemented on Base Object'));
  return false;
};

Cache.prototype.remove = function (path) {
  console.error(colors.red('ERROR: Remove Not implemented on Base Object'));
  return false;
};

Cache.prototype.garbageCollection = function (path) {
  console.error(colors.red('ERROR: Garbage Collect Not implemented on Base Object'));
  return false;
};

// Utility Function
function missingPath () {
  console.log(colors.red('ERROR: Path is required.'));
  console.trace('Cache Missing Path');
  return false;
}

module.exports = Cache;
