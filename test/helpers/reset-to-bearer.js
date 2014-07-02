'use strict';

var async = require('async');
var rarity = require('rarity');

var AnyFetch = require('../../lib/index.js');

/**
 * Reset the company and obtain the new Bearer token.
 * Automatically switch to Bearer auth.
 */
AnyFetch.prototype.resetToBearer = function(done) {
  var self = this;

  async.waterfall([
    function resetCompany(cb) {
      self.deleteCompanyReset(rarity.slice(1, cb));
    },
    function obtainNewToken(cb) {
      // Switch back to basic auth to obtain a new token
      self.authHeader = self.basicAuthHeader;
      self.getToken(cb);
    }
  ], function(err, res) {
    if(res && res.body && res.body.token) {
      // Switch to Bearer auth
      self.authHeader = 'Bearer ' + res.body.token;
    }
    done(err, res);
  });
};
