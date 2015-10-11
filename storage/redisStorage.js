var colors = require('colors');
var redis = require('redis');
var client = redis.createClient({return_buffers: true});

/**
 * Redis Storage
 *
 * Redis Database storage, will persist results
 *
 * Arguments
 * dbNum: 0-15 which db shard to use
 */
var RedisStorage = function (dbNum) {
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
};

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
 * cb: callback of what to do with the results
 */
RedisStorage.prototype.find = function (id, cb) {
  return client.hgetall(id, cb);
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
  var thisInstance = this;
  // Step 1: Get all of the keys
  client.keys('*',
    function (error, keys) {
      if (error) {
        console.error(colors.red('ERROR: Failed to GET from Redis ', error));
        callback(error);
      }
      if (keys) {
        // Step 2: Loop through the keys
        keys.forEach(function (key) {
          // Step 3: find the record in the DB
          thisInstance.find(key, function (error, obj) {
            if (error) {
              return callback(error);
            }
            return callback(null, key, obj);
          });
        });
      }
    }
  );
};

module.exports = RedisStorage;
