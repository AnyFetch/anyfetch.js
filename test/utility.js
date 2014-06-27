'use strict';

var should = require('should');
var async = require('async');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var extendDefaults = require('../lib/helpers/extend-defaults.js');
var makeResetFunction = require('./helpers/reset.js');

describe('<High-level helper functions>', function() {
  var anyfetch = new AnyFetch(configuration.test.login, configuration.test.password);
  var cleaner = makeResetFunction(anyfetch);

  describe('getDocumentWithInfo', function() {
    var documentId;

    before(cleaner);
    // Prepare a fake document
    before(function postFakeDocument(done) {
      var anyfetch = new AnyFetch(this.token);
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
  });

  describe('getDocumentsWithInfo', function() {

    before(cleaner);
    // Prepare two fake documents
    before(function(done) {
      var anyfetch = new AnyFetch(this.token);
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
      //TODO : remove dat shit (but solve ES shard indexing before)
      setTimeout(function() {
        anyfetch.getDocumentsWithInfo(function(err, docs) {
          should(err).not.be.ok;

          docs.data.forEach(function(doc) {
            should(err).not.be.ok;
            should(doc).be.ok;
            doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
            doc.provider.should.have.properties('client', 'name', 'document_count');
            doc.document_type.should.have.properties('id', 'name', 'templates');
          });

          done();
        });
      }, 1500);
    });
  });

  describe('sendDocumentAndFile', function() {
    before(cleaner);

    var doc = configuration.test.fakeDocument;
    var hash = extendDefaults({}, configuration.test.fakeImageFile);
    // Simply upload from filename
    hash.file = hash.path;

    it('should create the document and post the file without error', function(done) {
      var anyfetch = new AnyFetch(this.token);
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
        user.email.should.eql(configuration.test.login);

        done();
      });
    });
  });

  describe('createSubcompanyWithAdmin', function() {
    before(cleaner);
    var anyfetch;
    before(function() {
      anyfetch = new AnyFetch(this.token);
    });

    var admin = configuration.test.fakeUser;
    var subcompany = configuration.test.fakeCompany;
    var subcompanyId;

    it('should run smoothly', function(done) {
      anyfetch.createSubcompanyWithAdmin(subcompany, admin, function(err, company) {
        should(err).not.be.ok;
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

    // Subcompanies are not cleared by a simple reset, we must still delete it by hand
    after(function deleteFakeSubcompany(done) {
      anyfetch.deleteSubcompanyById(subcompanyId, done);
    });
  });

});
