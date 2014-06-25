'use strict';

var async = require('async');
var rarity = require('rarity');

var rarity = require('rarity');

/**
 * Create a new user and move it to a new subcompany.
 * The new user will be the first admin of the subcompany.
 * @param {Object} subcompany Informations of the subcompany
 * @param {Object} newAdmin User info of the admin to create.
 * @param {Function} cb(err, subcompany)
 */
module.exports = function createSubcompanyWithAdmin(subcompany, newAdmin, finalCb) {
  newAdmin.is_admin = true;

  var self = this;
  async.waterfall([
    // Create the admin user who will be named admin of the new subcompany
    function createAdmin(cb) {
      self.postUser(newAdmin, rarity.slice(1, cb));
    },

    function createSubcompany(cb) {
      var newAdminFetch = new self.constructor(newAdmin.email, newAdmin.password);
      newAdminFetch.postSubcompany(subcompany, function(err, res) {
        cb(err, res.body);
      });
    },
  ], finalCb);
};