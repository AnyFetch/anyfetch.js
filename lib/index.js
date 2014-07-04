'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @see http://anyFetch.com
 */

var configuration = require('../config/configuration.js');

var auth = require('./auth.js');
var addMappings = require('./mappings.js');
var addHelpers = require('./utility.js');
var createMockServer = require('./test-server/index.js');

/**
 * Supported syntaxes:
 * - `new AnyFetch(accessToken)` (token authentication)
 * - `new AnyFetch(login, password)` (basic authentication)
 */
var AnyFetch = function(accessToken, password) {
  if(password) {
    var payload = new Buffer(accessToken + ':' + password);
    this.basicAuthHeader = 'Basic ' + payload.toString('base64');
    this.authHeader = this.basicAuthHeader;
  }
  else {
    this.authHeader = 'Bearer ' + accessToken;
  }

  this.apiUrl = configuration.apiUrl;
};

/**
 * Override the default API_URL (useful for testing).
 */
AnyFetch.prototype.setApiUrl = function(url) {
  this.apiUrl = url;
};

// "Static" functions
AnyFetch.setManagerUrl = auth.setManagerUrl;
AnyFetch.getAccessToken = auth.getAccessToken;
AnyFetch.createMockServer = createMockServer;

// Low-level API mappings
addMappings(AnyFetch);

// High-level functions
addHelpers(AnyFetch);

module.exports = AnyFetch;
