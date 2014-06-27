'use strict';

var should = require('should');
var async = require('async');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

// TODO: use mock server

describe('<High-level helper functions>', function() {
  var anyfetch;
  var anyfetchBasic = new AnyFetch(configuration.test.login, configuration.test.password);

  // Retrieve token from credentials
  before(function retrieveToken(done) {
    anyfetchBasic.getToken(function(err, res) {
      anyfetch = new AnyFetch(res.body.token);
      done(err);
    });
  });

  describe('getDocumentWithInfo', function() {
    var documentId;

    before(function postFakeDocument(done) {
      anyfetch.postDocument(configuration.test.fakeDocument, function(err, res) {
        if(res.body && res.body.id) {
          documentId = res.body.id;
        }
        done(err);
      });
    });

    it('should get document and populate `document_type` and `provider`', function(done) {
      anyfetch.getDocumentWithInfo(documentId, function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
        doc.provider.should.have.properties('client', 'name', 'document_count');
        doc.document_type.should.have.properties('id', 'name', 'templates');

        done();
      });
    });

    it('same thing by identifier', function(done) {
      var identifier = configuration.test.fakeDocument.identifier;
      anyfetch.getDocumentByIdentifierWithInfo(identifier, function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
        doc.provider.should.have.properties('client', 'name', 'document_count');
        doc.document_type.should.have.properties('id', 'name', 'templates');

        done();
      });
    });

    after(function deleteFakeDocument(done) {
      anyfetch.deleteDocumentById(documentId, done);
    });
  });

  describe('getDocumentsWithInfo', function() {

    // Prepare two documents
    before(function postTwoFakeDocuments(done) {
      async.parallel([
        function(cb) {
          anyfetch.postDocument(configuration.test.fakeDocument, cb);
        },
        function(cb) {
          anyfetch.postDocument(configuration.test.fakeDocument2, cb);
        }
      ], done);
    });

    it('should get all documents and populate their `document_type` and `provider`', function(done) {
      anyfetch.getDocumentsWithInfo(function(err, docs) {
        docs.data.forEach(function(doc) {
          should(err).not.be.ok;
          should(doc).be.ok;
          doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
          doc.provider.should.have.properties('client', 'name', 'document_count');
          doc.document_type.should.have.properties('id', 'name', 'templates');
        });

        done();
      });
    });

    after(function deleteTwoFakeDocuments(done) {
      async.parallel([
        function(cb) {
          var identifier = configuration.test.fakeDocument.identifier;
          anyfetch.deleteDocumentByIdentifier(identifier, cb);
        },
        function(cb) {
          var identifier = configuration.test.fakeDocument2.identifier;
          anyfetch.deleteDocumentByIdentifier(identifier, cb);
        }
      ], done);
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

        done();
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

        done();
      });

    });

    after(function deleteFakeDocument(done) {
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

        done();
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

        done();
      });
    });

    it('should have created the new user and moved it to the subcompany', function(done) {
      var newAdminFetch = new AnyFetch(admin.email, admin.password);
      newAdminFetch.getCompany(function(err, res) {
        var company = res.body;
        should(err).not.be.ok;
        should(company).be.ok;
        company.should.have.property('id').and.equal(subcompanyId);

        done();
      });
    });

    after(function deleteFakeSubcompany(done) {
      anyfetch.deleteSubcompanyById(subcompanyId, done);
    });
  });

});
