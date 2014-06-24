'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

// TODO: use mock server (improve it to handle batch requests)

describe('<High-level helper functions>', function() {
  var anyfetch;
  var anyfetchBasic = new Anyfetch(configuration.test.login, configuration.test.password);

  // Retrieve token from credentials
  before(function(done) {
    anyfetchBasic.getToken(function(err, res) {
      anyfetch = new Anyfetch(res.body.token);
      done(err);
    });
  });

  describe('getDocumentWithInfo', function() {
    it('should get document and populate `document_type` and `provider`', function(done) {
      anyfetch.getDocumentWithInfo('53a14e0ad9d493b510e4191b', function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
        doc.provider.should.have.properties('client', 'name', 'document_count');
        doc.document_type.should.have.properties('id', 'name', 'templates');

        done(err);
      });
    });
  });

  describe('sendDocumentAndFile', function() {
    var doc = configuration.test.fakeDocument;
    var documentId;

    var hash = configuration.test.fakeImageFile;
    // Simply upload from filename
    hash.file = hash.path;

    it('should create the document', function(done) {
      anyfetch.sendDocumentAndFile(doc, hash, function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
        documentId = doc.id;

        done(err);
      });
    });

    it('should have updated the document with info from the file', function(done) {
      should(documentId).be.ok;

      // TODO: introduce delay to let the file be hydrated?
      anyfetch.getDocumentById(documentId, function(err, res) {
        var doc = res.body;
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('data');
        doc.data.should.have.properties({ 'extension': 'jpg' });

        done(err);
      });

    });

    after(function(done) {
      anyfetch.deleteDocumentById(documentId, done);
    });
  });

  describe('getCurrentUser', function() {
    it('should get the correct user', function(done) {
      anyfetch.getCurrentUser(function(err, user) {
        should(err).not.be.ok;
        should(user).be.ok;
        should(user).have.properties('id', 'email', 'name', 'is_admin');
        user.email.should.eql(configuration.test.login);

        done(err);
      });
    });
  });

  describe('createSubcompanyWithAdmin', function() {
    var admin = configuration.test.fakeUser;
    var subcompany = configuration.test.fakeCompany;
    var subcompanyId;

    it('should run smoothly', function(done) {
      anyfetch.createSubcompanyWithAdmin(subcompany, admin, function(err, company) {
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

        done(err);
      });
    });

    it('should have created the new user and moved it to the subcompany', function(done) {
      var newAdminFetch = new Anyfetch(admin.email, admin.password);
      newAdminFetch.getCompany(function(err, res) {
        var company = res.body;
        should(err).not.be.ok;
        should(company).be.ok;
        company.should.have.property('id').and.equal(subcompanyId);

        done(err);
      });
    });

    after(function(done) {
      anyfetch.deleteSubcompanyById(subcompanyId, done);
    });
  });

});
