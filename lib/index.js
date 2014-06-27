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

  this.apiUrl = configuration.apiUrl;
};

/**
 * Override the default API_URL (useful for testing).
 */
Anyfetch.prototype.setApiUrl = function(url) {
  this.apiUrl = url;
};

// "Static" functions
Anyfetch.setManagerUrl = auth.setManagerUrl;
Anyfetch.getAccessToken = auth.getAccessToken;

// Low-level API mappings
addMappings(Anyfetch);

// High-level functions
addHelpers(Anyfetch);

module.exports = Anyfetch;
