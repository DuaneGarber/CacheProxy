'use strict';
/**
 * In Memory Storage
 *
 * Simply JS Object storage, will not survive server stop/restart
 *
 * Arguments
 * none
 */
function InMemoryStorage () {
  this.data = {};
}

/**
 * Insert into Object
 *
 * Arguments:
 * id: hash key for storage
 * content: content to be stored in object
 */
InMemoryStorage.prototype.insert = function (id, content) {
  if (id && content) {
    this.data[id] = content;
    return true;
  } else {
    return false;
  }
};

/**
 * Finds record in object
 *
 * Arguments:
 * id: hash key of record to be found
 *
 * Returns a Promise Object
 */
InMemoryStorage.prototype.find = function (id) {
  // Error not possible, either its there or its not
  return new Promise(resolve => resolve(this.data[id] || false));
};

/**
 * Removes record from the obj
 *
 * Arguments:
 * id: hash key of record to be removed
 */
InMemoryStorage.prototype.remove = function (id) {
  delete this.data[id] || false;
};

/**
 * Loops through all of the records in the object
 *
 * Arguments:
 * callback: function to complete upon record retrival
 */
InMemoryStorage.prototype.each = function (callback) {
  let key;
  for (key in this.data) {
    if (this.data.hasOwnProperty(key)) {
      callback(null, key, this.data[key]);
    }
  }
};

module.exports = InMemoryStorage;
