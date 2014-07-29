'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @see http://anyFetch.com
 */

var configuration = require('../config/configuration.js');

var addMappings = require('./mappings.js');
var addHelpers = require('./utility.js');
var addManagerFunctions = require('./manager.js');
var createMockServer = require('./test-server/index.js');

/**
 * Supported syntaxes:
 * - `new AnyFetch(accessToken)` (bearer authentication)
 * - `new AnyFetch(login, password)` (basic authentication)
 */
var AnyFetch = function(accessToken, password) {
  if(password) {
    var payload = new Buffer(accessToken + ':' + password);
    this.basicAuthHeader = 'Basic ' + payload.toString('base64');
    this.authHeader = this.basicAuthHeader;
  }
  else {
    this.accessToken = accessToken;
    this.authHeader = 'Bearer ' + accessToken;
  }

  this.apiUrl = configuration.apiUrl;
  this.managerUrl = configuration.managerUrl;
};

/**
 * Override the default API_URL for the **current instance only**.
 * Useful for testing.
 */
AnyFetch.prototype.setApiUrl = function(url) {
  if(!url) {
    throw new Error('Cannot set apiUrl to ' + url);
  }
  this.apiUrl = url;
};

/**
 * Override the default API_URL for all future instances.
 * Useful for testing.
 */
AnyFetch.setApiUrl = function(url) {
  if(!url) {
    throw new Error('Cannot set apiUrl to ' + url);
  }
  configuration.apiUrl = url;
};

// Mock server (static function)
AnyFetch.createMockServer = createMockServer;

// Low-level API mappings
addMappings(AnyFetch);

// High-level functions
addHelpers(AnyFetch);

// Manager-related functions
addManagerFunctions(AnyFetch);

module.exports = AnyFetch;
