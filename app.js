'use strict';

let http = require('http');
let https = require('https');
let fs = require('fs');
let _ = require('lodash');
let express = require('express');
let app = express();
let proxyFactory = require('./proxy.js');
let projectPkg = require(process.cwd() + '/package.json');

// Command Line Parser
let argv = require('minimist')(process.argv.slice(2)) || {};
let defaults = projectPkg.defaults || {};
let host = argv.host || defaults.host;
let devHost = argv.devHost || defaults.devHost;
let useDBCaching = argv.useDBCaching || defaults.useDBCaching;
let port = argv.port || defaults.port;
let sslPort = argv.sslPort || defaults.sslPort;
let sslOptions = {
  key: fs.readFileSync('./certs/ssl-key.pem'),
  cert: fs.readFileSync('./certs/ssl-cert.pem')
};
let config = projectPkg.config || {};
let cacheOpts = config.cache || {};
// Proxy configuration
let proxyOptions = {
  devHost: devHost,
  port: port,
  sslPort: sslPort,
  useDBCaching: useDBCaching
};
_.merge(proxyOptions, cacheOpts);
let proxyMiddleware = proxyFactory(host, proxyOptions);

// Route all GET though our middleware
app.route('*')
  .get(proxyMiddleware);

console.log('\nserver listening on ports HTTP: ' + port + ' - HTTPS: ' + sslPort + '\n');
http.createServer(app).listen(port);
https.createServer(sslOptions, app).listen(sslPort);

