'use strict';
/**
 * @file Delete all the users (except the one that's logged in)
 * @see http://developers.anyfetch.com/endpoints/
 */

var async = require('async');

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}
var anyfetch = new Anyfetch(configuration.test.login, configuration.test.password);

async.waterfall([
    function(cb) {
      anyfetch.getUsers(function(err, res) {
        cb(err, res.body);
      });
    },
    function(users, cb) {
      // Use async.map
      async.map(users, function(user, cb) {
        if(user.email === configuration.test.login) {
          return cb(null);
        }
        
        console.log('Deleting user ' + user.email + ' (' + user.id + ')');
        anyfetch.deleteUserById(user.id, cb);
      }, cb);
    }

  ],
  function(err) {
    if(err) {
      throw err;
    }
    console.log('All users deleted.');
  }
);