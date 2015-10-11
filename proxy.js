var colors = require('colors');
var request = require('request');
var Cache = require('./cache/cache');
var InMemoryStorage = require('./storage/inMemoryStorage');
var RedisStorage = require('./storage/redisStorage');

module.exports = function (host, options) {
  options = options || {};
  // Determine what type of caching that will be used
  var storage = options.useDBCaching ? new RedisStorage() : new InMemoryStorage();
  var cache = new Cache(storage, options);

  // Express Routing Function expression
  return function (req, res, next) {
    cache.get(req.url, function (error, cachedResponse) {
      if (error) {
        return next(error);
      }
      var protocol = null;
      var encoding = null;

      // If we have a cached response send it immediately
      if (cachedResponse) {
        return res.status(200).send(cachedResponse);
      }

      // Configure request based on Secure status
      if (req.secure) {
        protocol = 'https://';
      } else {
        protocol = 'http://';
      }

      // This is actually the accepted solution to binaries in Request -- ADD MORE OPTS
      if (/jpe?g|gif|png|ico|bmp|tiff/.test(req.url)) {
        encoding = null;
      } else {
        encoding = undefined;
      }

      console.log(colors.cyan('Requesting ' + protocol + host + req.url));

      // Ensure the host is updated for the request
      req.headers.host = host;
      request({
        url: protocol + host + req.url,
        method: req.method,
        headers: req.headers,
        encoding: encoding,
        gzip: true,
        followRedirect: false
      }, function (error, response, body) {
        var contentSize = 0;

        if (error) {
          console.error(colors.red('ERROR: Request failed with Error ', error));
          return next(error);
        }

        // Handle Redirects
        if (response.statusCode > 300 && response.statusCode < 399) {
          return handleRedirects(res, response);
        }

        // Handle binaries and strings differently
        if (typeof body === 'string') {
          contentSize = Buffer.byteLength(body, 'utf8');
          console.log(colors.white(body.length + ' characters, ' + contentSize + ' bytes'));
        } else if (body instanceof Buffer) {
          contentSize = body.length;
          console.log(colors.white('Image size ' + contentSize + ' bytes'));
        }

        // Remove content encoding
        delete response.headers['content-encoding'];

        // Successful response, attempt to cache
        if (response.statusCode >= 200 && response.statusCode < 299 && contentSize > 0) {
          cache.store(req.url, body, contentSize);
        }

        // Set response headers
        res.set(response.headers);
        return res.status(response.statusCode || 404).send(body);
      });
    });
  };

  function handleRedirects (res, response) {
    // if we are redirecting within the host replace with local url
    if (response.headers && response.headers.location && response.headers.location.indexOf(host) > -1) {
      var loc = response.headers.location;
      if (loc.indexOf('https') > -1) {
        loc = loc.replace(host, options.devHost + ':' + options.sslPort);
      } else {
        loc = loc.replace(host, options.devHost + ':' + options.port);
      }
      // Setting the response headres to the proper local location
      return res.redirect(loc);
    }
  }
};
