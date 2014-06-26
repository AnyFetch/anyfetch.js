'use strict';

var async = require('async');
var rarity = require('rarity');

module.exports = function makeResetFunction(anyfetchBasic) {
  /**
   * Reset the company and obtain the new Bearer token
   */
  return function(done) {
    var self = this;
    
    async.waterfall([
      function resetCompany(cb) {
        anyfetchBasic.deleteCompanyReset(rarity.slice(1, cb));
      },
      function obtainNewToken(cb) {
        anyfetchBasic.getToken(cb);
      }
    ], function(err, res) {
      if(err) {
        throw err;
      }
      self.token = res.body.token;
      done();
    });
  };
};