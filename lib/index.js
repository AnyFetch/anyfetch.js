'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @see http://anyFetch.com
 */

var configuration = require('../config/configuration.js');

var auth = require('./auth.js');
var addMappings = require('./mappings.js');
var addHelpers = require('./utility.js');

/**
 * Supported syntaxes:
 * - `new AnyFetch(accessToken)` (token authentication)
 * - `new AnyFetch(login, password)` (basic authentication)
 */
var Anyfetch = function(accessToken, password) {
  if(password) {
    // This is actually username:password
    var payload = new Buffer(accessToken + ':' + password);
    this.authHeader = 'Basic ' + payload.toString('base64');
  }
  else {
    this.authHeader = 'Bearer ' + accessToken;
  }

  this.apiHost = configuration.apiHost;
};

/**
 * Override the default API_HOST (useful for testing).
 */
Anyfetch.prototype.setApiHost = function(host) {
  this.apiHost = host;
};

// "Static" functions
Anyfetch.setManagerHost = auth.setManagerHost;
Anyfetch.getAccessToken = auth.getAccessToken;

// Low-level API mappings
addMappings(Anyfetch);

// High-level functions
addHelpers(Anyfetch);

module.exports = Anyfetch;