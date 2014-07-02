'use strict';

var async = require('async');
var request = require('supertest');
var should = require('should');

var configuration = require('../config/configuration.js');
var AnyFetch = require('../lib/index.js');

if(!configuration.test.rootLogin || !configuration.test.rootPassword) {
  throw new Error('The test suite requires valid LOGIN and PASSWORD to be set in your env');
}

/**
 * Create an isolated subcompany with its own admin.
 * It allows us to run tests & resets as much as we want without interfering
 * with other test suites using the same AnyFetch account.
 */
before(function createCompartment(done) {
  var req = request(configuration.apiUrl);

  var timestamp = (new Date()).getTime();
  configuration.test.user = {
    email: "test-" + timestamp + "@anyfetch.com",
    name: "test-" + timestamp,
    password: "test_password",
    is_admin: false
  };
  configuration.test.subcompany = {
    "name": "test-company-" + timestamp,
  };

  async.waterfall([
    function createUser(cb) {
      req.post('/users')
        .send(configuration.test.user)
        .auth(configuration.test.rootLogin, configuration.test.rootPassword)
        .end(cb);
    },
    function createSubcompanyAndUpdateCredential(res, cb) {
      configuration.test.subcompany.user = res.body.id;

      req.post('/subcompanies')
        .send(configuration.test.subcompany)
        .auth(configuration.test.rootLogin, configuration.test.rootPassword)
        .end(cb);
    },
    function saveSubcompanyId(res, cb) {
      configuration.test.subcompany.id = res.body.id;
      cb();
    }
  ], done);
});

describe('check compartmentalization', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  it('should be the compartmentalized subcompany', function(done) {
    anyfetch.getCompany(function(err, res) {
      should(err).not.be.ok;
      should(res.body).be.ok;

      res.body.should.have.property({ 'id': configuration.test.subcompany.id });
      done();
    });
  });

  it('should have no other user', function(done) {
    anyfetch.getUsers(function(err, res) {
      should(err).not.be.ok;
      should(res.body).be.ok;

      res.body.should.have.length(1);
      res.body[0].should.have.property({ email: configuration.test.user.email });
      done();
    });
  });
});

after(function deleteTestSubcompany(done) {
  request(configuration.apiUrl)
    .del('/subcompanies/' + configuration.test.subcompany.id)
    .auth(configuration.test.rootLogin, configuration.test.rootPassword)
    .end(done);
});
