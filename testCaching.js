// Caching Unit Tests
var test = require('tape');
var MemoryCaching = require('./cache/memoryCaching');
var RedisCaching = require('./cache/redisCaching');
var options = {
  cacheDuration: 60000,
  cacheSizeBytes: 10,
  cacheSizeElements: 5
};

test('Caching Validation', function (t) {
  var cacheStores = [];
  cacheStores.push(new MemoryCaching(options));
  cacheStores.push(new RedisCaching(options, 15));

  cacheStores.forEach(function (thisCache) {
    t.plan(12);

    thisCache.store('test1', 'body1', 10);

    t.equal(thisCache.cachedElements, 1, '1 Item is in the cache upon storage');

    thisCache.get('test1', function (error, cachedObj) {
      if (error) {
        t.end();
      }
      t.equal(cachedObj, 'body1', '"test1" was properly stored');
      thisCache.expire('test1');
      t.equal(thisCache.cachedElements, 0, '0 Items are in the cache upon expiration');

      thisCache.store('test1', 'body1', 15);
      t.equal(thisCache.cachedElements, 0, '0 Items are in the cache upon attempting to insert too large of file');

      thisCache.store('test1', 'body1', 5);
      thisCache.store('test2', 'body2', 9);
      thisCache.store('test3', 'body3', 1);
      thisCache.store('test4', 'body4', 3);
      thisCache.store('test5', 'body5', 8);

      t.equal(thisCache.cachedElements, 5, '5 Items are in the cache upon storage');

      thisCache.store('test6', 'body6', 6);

      t.equal(thisCache.cachedElements, 5, '5 Items are in the cache because the 6th was rejected');
    });
  });
});
