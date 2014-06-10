'use strict';

var request = require('supertest');

// TODO: make configurable
var apiHost = 'api.anyfetch.com';
request = request(apiHost);

/**
 * Trade authentification credentials for an access token with the AnyFetch API.
 * @param {String} APP_ID
 * @param {String} APP_SECRET
 * @param {function} cb(err, accessToken)
 */
var getToken = function(APP_ID, APP_SECRET, cb) {
  request.get('/token')
    .auth(APP_ID, APP_SECRET)
    .expect(200)
    .end(function(err, res) {
     cb(err, res.res.body);
    });
};

module.exports.getToken = getToken;