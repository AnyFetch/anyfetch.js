'use strict';

var should = require('should');
var fs = require('fs');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');
var isFunction = require('../../lib/helpers/is-function.js');
var extendDefaults = require('../../lib/helpers/extend-defaults.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('> document-related functions', function() {
    describe('getDocuments parameters', function() {
      it('should allow arbitrary parameters (noCheckParams)', function(done){
        anyfetch.getDocuments({
          "search": 'some_search_query',
          "_arbitrary_key": 'arbitrary value',
          "has_key": true
        }, done);
      });
    });

    describe('getDocumentById & getDocumentByIdentifier subfunctions', function() {
      before(function reset(done) {
        anyfetch.resetToBearer(done);
      });

      var documentId = null;
      var fakeDocument = configuration.test.fakeDocument;
      var subFunctions;

      before(function(done) {
        anyfetch.postDocument(fakeDocument, function(err, res) {
          documentId = res.body.id;
          subFunctions = anyfetch.getDocumentById(documentId);
          done(err);
        });
      });

      it('should return synchronously an object containing only functions', function() {
        for(var i in subFunctions) {
          isFunction(subFunctions[i]).should.be.ok;
        }
      });

      it('should only accept mongo-style ids in single-step call', function(done) {
        anyfetch.getDocumentById('aze', function(err) {
          should(err).be.ok;
          err.message.toLowerCase().should.include('argument error');
          done();
        });
      });

      it('should only accept mongo-style ids in subfunction call', function(done) {
        anyfetch.getDocumentById('aze').getRaw(function(err) {
          should(err).be.ok;
          err.message.toLowerCase().should.include('argument error');
          done();
        });
      });

      describe('postFile', function() {
        it('should only accept mongo-style ids', function(done) {
          anyfetch.getDocumentById('aze').postFile({}, function(err) {
            should(err).be.ok;
            err.message.toLowerCase().should.include('argument error');
            done();
          });
        });

        it('should err on missing `file` key in config hash', function(done) {
          var hash = extendDefaults({}, configuration.test.fakeImageFile);
          delete hash.file;
          subFunctions.postFile(hash, function(err) {
            should(err).be.ok;
            err.message.toLowerCase().should.include('must contain a `file` key');
            done();
          });
        });

        it('should accept a function as `config` parameter', function(done) {
          var deliverConfig = function(cb) {
            cb(null, {
              not_a_file_key: 'on purpose'
            });
          };
          subFunctions.postFile(deliverConfig, function(err) {
            should(err).be.ok;
            err.message.toLowerCase().should.include('must contain a `file` key');
            done();
          });
        });

        it('should post file created with `fs.createReadStream`', function(done) {
          // Warning! Do not write directly in an object from `configuration`, its scope is global!
          var hash = extendDefaults({}, configuration.test.fakeImageFile);
          hash.file = fs.createReadStream(hash.path);
          subFunctions.postFile(hash, done);
        });

        it('should post file without knowing mime-type', function(done) {
          var file = fs.createReadStream(configuration.test.fakeImageFile.path);
          subFunctions.postFile({ file: file }, done);
        });

        it('should post file from a path', function(done) {
          var filename = __dirname + '/../samples/hello.md';
          subFunctions.postFile({ file: filename }, done);
        });

        it('should post file to document by identifier', function(done) {
          var filename = __dirname + '/../samples/hello.md';
          anyfetch.getDocumentByIdentifier(fakeDocument.identifier).postFile({ file: filename }, done);
        });
      });

      describe('getDocumentByIdentifier', function() {
        var documentIdentifier = fakeDocument.identifier;

        var subFunctionsByIdentifier;
        before(function retrieveSubfunctions() {
          subFunctionsByIdentifier = anyfetch.getDocumentByIdentifier(documentIdentifier);
        });

        it('should offer the same functions as byId', function() {
          subFunctionsByIdentifier.should.have.keys(Object.keys(subFunctions));

          for(var i in subFunctionsByIdentifier) {
            isFunction(subFunctionsByIdentifier[i]).should.be.ok;
            subFunctions[i].should.be.ok;
          }
        });

        it('should retrieve the document with this identifier', function(done) {
          anyfetch.getDocumentsByIdentifier(documentIdentifier, function(err, res) {
            should(err).be.exactly(null);
            should(res).be.ok;
            should(res.body).be.ok;
            should(res.body.identifier).be.ok;
            res.body.identifier.should.equal(documentIdentifier);
            done();
          });
        });

        it('should retrieve the document with this identifier (via the alias function as well)', function(done) {
          anyfetch.getDocumentByIdentifier(documentIdentifier, function(err, res) {
            should(err).be.exactly(null);
            should(res).be.ok;
            should(res.body).be.ok;
            should(res.body.identifier).be.ok;
            res.body.identifier.should.equal(documentIdentifier);
            done();
          });
        });

        it('should accept any kind of identifier', function(done) {
          subFunctionsByIdentifier.getRaw(function(err) {
            should(err).be.exactly(null);
            done();
          });
        });
      });
    });

    describe('patchDocumentById', function() {
      var documentId = null;
      var fakeDocument = configuration.test.fakeDocument;

      it('...create phony document', function(done) {
        anyfetch.postDocument(fakeDocument, function(err, res) {
          documentId = res.body.id;
          done(err);
        });
      });

      it('should run smoothly', function(done) {
        var changes = {
          data: {
            has_been_patched: true
          }
        };
        anyfetch.patchDocumentById(documentId, changes, done);
      });

      it('should have applied the changes', function(done) {
        anyfetch.getDocumentById(documentId).getRaw(function(err, res) {
          should(err).not.be.ok;
          should(res).be.ok;

          var doc = res.body;
          doc.should.have.property('data');
          doc.data.should.have.property({ has_been_patched: true });

          done();
        });
      });
    });
  });
});
