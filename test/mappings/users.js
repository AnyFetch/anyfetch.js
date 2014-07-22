'use strict';

var should = require('should');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

var clearUsers = require('../../script/clear-users.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('> user-related functions', function() {
    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });
    before(function clearTheUsers(done) {
      clearUsers(anyfetch, done);
    });

    var userInfos = configuration.test.fakeUser;
    var newName = "My New Name";
    var userId = null;

    it('postUser() should run smoothly', function(done) {
      anyfetch.postUser(userInfos, function(err, res) {
        userId = res.body.id;
        done(err);
      });
    });

    it('patchUserById() should run smoothly', function(done) {
      // This endpoint is only available with Basic auth
      var anyfetchBasic = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
      var changes = {
        name: newName
      };
      anyfetchBasic.patchUserById(userId, changes, done);
    });

    it('patchUserById() should have applied the changes', function(done) {
      anyfetch.getUserById(userId, function(err, res) {
        should(err).not.be.ok;
        should(res).be.ok;
        res.body.should.have.property({ name: newName });
        done();
      });
    });

    it('deleteUserById() should run smoothly', function(done) {
      anyfetch.deleteUserById(userId, done);
    });
  });
});
