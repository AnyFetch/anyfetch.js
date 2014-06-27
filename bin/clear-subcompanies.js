'use strict';
/**
 * @file Delete all the subcompanies of this account
 * @see http://developers.anyfetch.com/endpoints/
 */

var async = require('async');

var configuration = require('../config/configuration.js');
var AnyFetch = require('../lib/index.js');

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}
var anyfetch = new AnyFetch(configuration.test.login, configuration.test.password);

async.waterfall([
    function(cb) {
      anyfetch.getSubcompanies(function(err, res) {
        cb(err, res.body);
      });
    },
    function(subcompanies, cb) {
      async.map(subcompanies, function(subcompany, cb) {
        console.log('Deleting subcompany ' + subcompany.id);
        anyfetch.deleteSubcompanyById(subcompany.id, {}, cb);
      }, cb);
    }

  ],
  function(err) {
    if(err) {
      throw err;
    }
    console.log('All subcompanies deleted.');
  }
);