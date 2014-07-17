'use strict';

var request = require('supertest');

var configuration = require('../config/configuration.js');

/**
 * Extend the prototype of Anyfetch with manager-related functions
 */
module.exports = function addManagerFunctions(AnyFetch) {
  /**
   * Override the default MANAGER_URL for the **current instance only**.
   * Useful for testing.
   */
  AnyFetch.prototype.setManagerUrl = function(url) {
    this.managerUrl = url;
  };

  /**
   * Override the default MANAGER_URL for all future instances.
   * Useful for testing.
   */
  AnyFetch.setManagerUrl = function(url) {
    configuration.managerUrl = url;
  };

  /**
   * Trade authentification credentials for an access token with the AnyFetch API.
   * @param {String} APP_ID Obtained from manager.anyfetch.com
   * @param {String} APP_SECRET Obtained from manager.anyfetch.com
   * @param {String} code Code obtained during the first step of the oAuth flow
   * @param {function} cb(err, accessToken)
   */
  AnyFetch.getAccessToken = function(APP_ID, APP_SECRET, code, cb) {
    var body = {
      client_id: APP_ID,
      client_secret: APP_SECRET,
      code: code,
      grant_type: 'authorization_code'
    };

    request(configuration.managerUrl)
      .post(configuration.oAuthEndpoint)
      .type('form')
      .send(body)
      .expect(200)
      .end(function(err, res) {
        if(err) {
          return cb(err);
        }
        if(!res.body || !res.body.access_token) {
          return cb(new Error('Expected response to contain `access_token`, got ' + res.body));
        }

        cb(err, res.body.access_token);
      });
  };


  return AnyFetch;
};
