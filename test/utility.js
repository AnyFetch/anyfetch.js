'use strict';

var should = require('should');
var async = require('async');

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

  describe('getDocumentWithInfo', function() {
    var documentId;

    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });
    // Prepare a fake document
    before(function postFakeDocument(done) {
      anyfetch.postDocument(configuration.test.fakeDocument, function(err, res) {
        if(res.body && res.body.id) {
          documentId = res.body.id;
        }
        done(err);
      });
    });

    it('should only accept mongo-style ids', function(done) {
      anyfetch.getDocumentWithInfo('octodad', function(err) {
        should(err).be.ok;
        err.message.toLowerCase().should.include('argument error');
        done();
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
    before(function reset(done) {
      anyfetch.resetToBearer(done);
    });

    // Prepare two fake documents
    before(function postFakeDocuments(done) {
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
      // TODO : remove dat shit (but solve ES shard indexing before)
      setTimeout(function() {
        anyfetch.getDocumentsWithInfo({ sort: 'creationDate' }, function(err, docs) {
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

    it('should allow `params` to be omitted', function(done) {
      anyfetch.getDocumentsWithInfo(done);
    });
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

    after(function deleteSubcompany(done) {
      anyfetch.deleteSubcompanyById(subcompanyId, done);
    });
  });

});
