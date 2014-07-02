'use strict';

require('should');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

var clearSubcompanies = require('../../script/clear-subcompanies.js');
var clearUsers = require('../../script/clear-users.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('> subcompanies-related functions', function() {
    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });
    before(function clearTheUsers(done) {
      clearUsers(anyfetch, done);
    });
    before(function clearTheSubcompanies(done) {
      clearSubcompanies(anyfetch, done);
    });

    var userInfos = configuration.test.fakeUser;
    var companyInfos = {
      name: 'the-fake-company'
    };
    var subcompanyId = null;

    before(function createFakeUser(done) {
      // Setup: an admin user who will be named admin of the new subcompany
      anyfetch.postUser(userInfos, function(err, res) {
        companyInfos.user = res.body.id;
        done(err);
      });
    });

    it('should create a subcompany with the new user', function(done) {
      anyfetch.postSubcompanies(companyInfos, function(err, res) {
        subcompanyId = res.body.id;
        done(err);
      });
    });

    it('should get the subcompany', function(done) {
      anyfetch.getSubcompaniesById(subcompanyId, function(err, res) {
        res.body.should.have.property({
          name: companyInfos.name
        });
        done(err);
      });
    });

    it('should delete the subcompany (omitting the `force` argument)', function(done) {
      anyfetch.deleteSubcompaniesById(subcompanyId, done);
    });
  });
});
