'use strict';

var async = require('async');

/**
 * Create a new user and move it to a new subcompany.
 * The new user will be the first admin of the subcompany.
 * @param {Object} subcompany Informations of the subcompany
 * @param {Object} newAdmin User info of the admin to create.
 * @param {Function} cb(err, { subcompany: [Object], admin: [Object] })
 */
module.exports = function createSubcompanyWithAdmin(subcompany, newAdmin, finalCb) {
  newAdmin.is_admin = true;

  var self = this;
  async.waterfall([
    // Create the admin user who will be named admin of the new subcompany
    function createAdmin(cb) {
      self.postUser(newAdmin, cb);
    },
    function extractId(res, cb) {
      cb(null, res.body);
    },
    function createSubcompany(admin, cb) {
      subcompany.user = admin.id;
      self.postSubcompany(subcompany, function(err, res) {
        var results = {
          subcompany: res.body,
          admin: admin
        };
        cb(err, results);
      });
    },
  ], finalCb);
};
