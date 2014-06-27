'use strict';

/**
 * @file Delete all the subcompanies of this account
 * @see http://developers.anyfetch.com/endpoints/
 */

var async = require('async');

var configuration = require('../config/configuration.js');
var AnyFetch = require('../lib/index.js');

module.exports = function clearSubcompanies(done) {
  var anyfetch = new AnyFetch(configuration.test.login, configuration.test.password);

  async.waterfall([
    function(cb) {
      anyfetch.getSubcompanies(function(err, res) {
        cb(err, res.body);
      });
    },
    function(subcompanies, cb) {
      async.map(subcompanies, function(subcompany, cb) {
        anyfetch.deleteSubcompanyById(subcompany.id, {}, cb);
      }, cb);
    }
  ], done);
};
