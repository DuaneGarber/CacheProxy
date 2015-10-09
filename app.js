var http = require('http');
var https = require('https');
var fs = require('fs');
var _ = require('lodash');
var express = require('express');
var app = express();
var proxyFactory = require('./proxy.js');
var projectPkg = require(process.cwd() + '/package.json');

// Command Line Parser
var argv = require('minimist')(process.argv.slice(2)) || {};
var defaults = projectPkg.defaults || {};
var host = argv.host || defaults.host;
var devHost = argv.devHost || defaults.devHost;
var useDBCaching = argv.useDBCaching || defaults.useDBCaching;
var port = argv.port || defaults.port;
var sslPort = argv.sslPort || defaults.sslPort;
var sslOptions = {
  key: fs.readFileSync('./certs/ssl-key.pem'),
  cert: fs.readFileSync('./certs/ssl-cert.pem')
};
var config = projectPkg.config || {};
var cacheOpts = config.cache || {};
// Proxy configuration
var proxyOptions = {
  devHost: devHost,
  port: port,
  sslPort: sslPort,
  useDBCaching: useDBCaching
};
_.merge(proxyOptions, cacheOpts);
var proxyMiddleware = proxyFactory(host, proxyOptions);

// Route all GET though our middleware
app.route('*')
  .get(proxyMiddleware);

console.log('\nserver listening on ports HTTP: ' + port + ' - HTTPS: ' + sslPort + '\n');
http.createServer(app).listen(port);
https.createServer(sslOptions, app).listen(sslPort);

