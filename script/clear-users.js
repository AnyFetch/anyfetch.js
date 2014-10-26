'use strict';
/**
 * @file Delete all the users (except the one that's logged in)
 * @see http://developers.anyfetch.com/endpoints/
 */

var async = require('async');

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

module.exports = function(anyfetch, done) {
  if(!done) {
    done = anyfetch;
    anyfetch = new Anyfetch(configuration.test.rootLogin, configuration.test.rootPassword);
  }

  async.waterfall([
      function getIndex(cb) {
        anyfetch.getIndex(cb);
      },
      function getUsers(res, cb) {
        var currentEmail = res.body.user_email;
        anyfetch.getUsers(function(err, res) {
          cb(err, currentEmail, res.body);
        });
      },
      function deleteAllUsers(currentEmail, users, cb) {
        async.map(users, function(user, cb) {
          // We'd like not to delete the currently logged-in user
          if(user.email === currentEmail) {
            return cb(null);
          }
          anyfetch.deleteUserById(user.id, cb);
        }, cb);
      }
    ], done);
};
