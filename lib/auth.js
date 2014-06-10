'use strict';

var request = require('supertest');

// TODO: make configurable
var apiHost = 'api.anyfetch.com';
request = request(apiHost);

/**
 * Trade authentification credentials for an access token with the AnyFetch API.
 * @param {String} APP_ID
 * @param {String} APP_SECRET
 * @param {String} code
 * @param {function} cb(err, accessToken)
 */
var getAccessToken = function(APP_ID, APP_SECRET, code cb) {
  // TODO
};

module.exports.getAccessToken = getAccessToken;