'use strict';

var async = require('async');

/**
 * Get the user's information (id, email, etc) from the currently used credentials.
 * @param {Function} cb(err, user)
 */
module.exports = function getCurrentUser(finalCb) {
  var self = this;
  async.waterfall([
    function makeBatchCall(cb) {
      var pages = {
        '/': {},
        '/users': {}
      };
      self.batch(pages, cb);
    },

    function handleResults(res, cb) {
      var index = res.body['/'];
      var users = res.body['/users'];

      for(var i in users) {
        if(users[i].email === index.user_email) {
          return cb(null, users[i]);
        }
      }

      cb(new Error('NotFound: no user with email ' + index.user_email + ' was found'));
    }
  ], finalCb);
};