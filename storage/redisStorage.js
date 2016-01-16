'use strict';

const colors = require('colors');
const bluebird = require('bluebird');
let redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient({return_buffers: true});

/**
 * Redis Storage
 *
 * Redis Database storage, will persist results
 *
 * Arguments
 * dbNum: 0-15 which db shard to use
 */
function RedisStorage (dbNum) {
  client.on('ready', function (err) {
    if (err) {
      console.error(colors.red('ERROR: Redis is not READY', err));
    } else {
      console.log(colors.green('Redis Client is ready!'));
    }
  });

  // Specific specific db number (defaults to 0)
  if (dbNum && dbNum >= 0 && dbNum <= 15) {
    client.select(dbNum);
  }
}

/**
 * Insert into DB
 *
 * Arguments:
 * id: hash key for storage
 * content: content to be stored in db
 */
RedisStorage.prototype.insert = function (id, content) {
  client.hmset(id, content,
  function (error) {
    if (error) {
      console.error(colors.red('ERROR: Failed to Insert into Redis ', error));
      return false;
    }
    return true;
  });
};

/**
 * Finds record in DB
 *
 * Arguments:
 * id: hash key of record to be found
 *
 * returns a Promise Object
 */
RedisStorage.prototype.find = function (id) {
  return new Promise((resolve, reject) =>
    client.hgetallAsync(id).then(cacheObj => resolve(cacheObj)).catch(error => reject(error))
  );
};

/**
 * Removes record from the database
 *
 * Arguments:
 * id: hash key of record to be removed
 */
RedisStorage.prototype.remove = function (id) {
  client.del(id,
  function (error) {
    if (error) {
      console.error(colors.red('ERROR: Failed to GET from Redis ', error));
      return false;
    }
    return true;
  });
};

/**
 * Loops through all of the records in the DB
 *
 * Arguments:
 * callback: function to complete upon record retrival
 */
RedisStorage.prototype.each = function (callback) {
  // Step 1: Get all of the keys
  client.keys('*',
    (error, keys) => {
      if (error) {
        console.error(colors.red('ERROR: Failed to GET from Redis ', error));
        callback(error);
      }
      if (keys) {
        // Step 2: Loop through the keys
        keys.forEach(key => {
          // Step 3: find the record in the DB
          this.find(key).then(
              cacheObj => {
                return {
                  key,
                  cacheObj
                };
              }
            ).catch(
              error => error
          );
        });
      }
    }
  );
};

/**
 * Loops through all of the records in the DB
 *
 * Generator that returns the next row for looping purposes
 */
RedisStorage.prototype.getIterator = function () {
  return {
    next: () => {
      // Step 1: Get all of the keys
      client.keysAync('*').then(
        keys =>
          // Step 2: Loop through the keys
          keys.forEach(key => {
            // Step 3: find the record in the DB
            this.find(key).then(
              cacheObj => {
                return {
                  key,
                  cacheObj
                };
              }
            ).catch(
              error => error
            );
          }
        )
      ).catch(
        error => {
          console.error(colors.red('ERROR: Failed to GET from Redis ', error));
          throw (error);
        }
      );
    }
  }
};

module.exports = RedisStorage;
