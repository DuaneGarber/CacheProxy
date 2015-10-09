# Usage Instructions
System Requirements:
Node 0.12.7 OR 0.10.x
NPM

Execute `npm install` to download node modules required for execution

To Start Program:
Execute `node app.js` on root directory
Open your browser to http://localhost:3000 and you will be accessing google, through the proxy.

Customization can occur on the command line with the following arguments.

# Command Line Configurations
* host <hostname> (optional, defaults to 'www.google.com')
* devHost <dev_hostname> (optional, defaults to 'localhost')
* useDBCaching <boolean> (optional, defaults to false) DO NOT pass true without redis installed locally
* port <number> (optional, defaults to 3000) -- HTTP Port Number
* sslPort <number> (optional, defaults to 3001) -- HTTPS Port Number

# Server (app.js)
Simple Express server, middleware is built using passed in parameters with defaults living in package.json.


# Proxy (proxy.js)
Built with a simple enclosure that would enable multiple proxies to be set up to different hosts with different options.

Logical Steps:
1. Check if request is cached
  a. If it is, respond immediately with the body
  b. Due to the fact that I added DB support, the data is returned asynchronously
2. Determine appropriate protocol for request
3. Handle binary encoding for Request module
4. Make the request
5. Handle any redirects
6. Determine response size
7. If the request responds with a 2XX response
  a. Attempt to cache request
8. Set the headers of our response with that of the proxied request response
9. Return status code and body

# Caching (/cache/*)
## Cache
Cache is a Base Object that is storage agnostic.  All of the logic for handling caching is built into Cache's prototype methods.

### Constructor
* Assigns options to an instance variable.
* Initialize storage counter
* Starts the garbage collection method in an interval that runs every minute

### Prototype Methods
1. get
  a. Gets the cache object
2. expire
  a. Expires the cache
3. store
  a. Stores the cached object
  b. Handles all configuration checks (size/number)

### 'Interface' Methods
Cache requires its children to implement 4 functions:
1. Insert
2. Find
3. Remove
4. Garbage Collection

## MemoryCaching
Extends Cache and implements storage functions. This storage type is a plain old javascript object {}.

## RedisCaching
Extends Cache and implements storage functions. This storage is stored into a database so it is persistent across executions.

### Constructor
Since it is persistent, it executes garbage collection on startup.