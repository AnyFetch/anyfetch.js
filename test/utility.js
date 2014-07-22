'use strict';

var should = require('should');

var AnyFetch = require('../lib/index.js');
require('./helpers/reset-to-bearer.js');
var configuration = require('../config/configuration.js');
var extendDefaults = require('../lib/helpers/extend-defaults.js');

var clearSubcompanies = require('../script/clear-subcompanies.js');
var clearUsers = require('../script/clear-users.js');

describe('<High-level helper functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('sendDocumentAndFile', function() {
    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });

    var doc = configuration.test.fakeDocument;
    var hash = extendDefaults({}, configuration.test.fakeImageFile);
    // Simply upload from filename
    hash.file = hash.path;

    it('should create the document and post the file without error', function(done) {
      anyfetch.sendDocumentAndFile(doc, hash, function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');

        done();
      });
    });
  });

  describe('getCurrentUser', function() {
    it('should get the correct user', function(done) {
      anyfetch.getCurrentUser(function(err, user) {
        should(err).not.be.ok;
        should(user).be.ok;
        should(user).have.properties('id', 'email', 'name', 'is_admin');
        user.email.should.eql(configuration.test.user.email);

        done();
      });
    });
  });

  describe('createSubcompanyWithAdmin', function() {
    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });
    before(function clearTheUsers(done) {
      clearUsers(anyfetch, done);
    });
    before(function clearTheSubcompanies(done) {
      clearSubcompanies(anyfetch, done);
    });

    var admin = configuration.test.fakeUser;
    var subcompany = configuration.test.fakeCompany;
    var subcompanyId;

    it('should run smoothly and return infos from subcompany and admin', function(done) {
      anyfetch.createSubcompanyWithAdmin(subcompany, admin, function(err, company, user) {
        should(err).not.be.ok;
        should(company).be.ok;
        should(user).be.ok;

        company.should.have.properties('id', 'name');
        user.should.have.properties('id', 'email');

        subcompanyId = company.id;
        done(err);
      });
    });

    it('should have created the subcompany', function(done) {
      should(subcompanyId).be.ok;

      anyfetch.getSubcompanyById(subcompanyId, function(err, res) {
        var subcompany = res.body;
        should(err).not.be.ok;
        should(subcompany).be.ok;
        subcompany.should.have.property('id').and.equal(subcompanyId);

        done();
      });
    });

    it('should have created the new user and moved it to the subcompany', function(done) {
      var newAdminFetch = new AnyFetch(admin.email, admin.password);
      newAdminFetch.getCompany(function(err, res) {
        should(err).not.be.ok;

        var company = res.body;
        should(company).be.ok;
        company.should.have.property('id').and.equal(subcompanyId);

        done();
      });
    });

    after(function deleteSubcompany(done) {
      anyfetch.deleteSubcompanyById(subcompanyId, done);
    });
  });

});
