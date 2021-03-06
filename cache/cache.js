'use strict';

let colors = require('colors');

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
function Cache (dataStore, options) {
  if (!dataStore) {
    throw new Error('A Data Store must be provided');
  }

  this.dataStore = dataStore;

  // Ensure default values are set
  options.cacheDuration = options.cacheDuration || 60000;
  options.cacheSizeBytes = options.cacheSizeBytes || 50000;
  options.cacheSizeElements = options.cacheSizeElements || 50;

  this.options = options;
  this.cachedElements = 0;

  // Execute Garbage Collection every 60 seconds
  setInterval(() => {
    console.log(colors.cyan('---------- Garbage Collection ----------'));
    this.garbageCollection();
  }, 60000);

  // Call Garbage collection
  this.garbageCollection();
}

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
Cache.prototype.get = function (path) {
  return new Promise((resolve, reject) => {
    if (!path) {
      missingPath();
      return resolve(false);
    }

    this.find(path).then(
      (cacheObj) => {
        // Not a cache hit
        if (!cacheObj) {
          return resolve(false);
        }

        // 2 Options: cache is fresh/stale
        if (Date.now() < cacheObj.exp) {
          console.log(colors.magenta('Returning Cached Response for ' + path));
          return resolve(cacheObj.body);
        }

        // Expired Path
        this.expire(path);
        return resolve(false);
      }
    ).catch(
      error => reject(error)
    );
  });
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

Cache.prototype.insert = function (path, body) {
  let data = {
    body: body,
    exp: Date.now() + this.options.cacheDuration
  };
  this.dataStore.insert(path, data);
};

Cache.prototype.find = function (path, cb) {
  return this.dataStore.find(path, cb);
};

Cache.prototype.remove = function (path) {
  return this.dataStore.remove(path);
};

/**
 * Ensures stale caches are not kept in the database past expiration
 *
 * Loops through records, expiring all records that are stale
 */
Cache.prototype.garbageCollection = function () {
  let currentTime = Date.now();
  this.dataStore.each((error, path, cacheObj) => {
    if (error) {
      console.error(colors.red('ERROR: Garbage collection reported error: ', error));
      return false;
    }
    if (path && cacheObj && cacheObj.exp < currentTime) {
      this.expire(path);
    }
  });
};

// Utility Function
function missingPath () {
  console.log(colors.red('ERROR: Path is required.'));
  console.trace('Cache Missing Path');
  return false;
}

module.exports = Cache;
