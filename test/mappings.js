'use strict';

var should = require('should');
var fs = require('fs');
var async = require('async');
var rarity = require('rarity');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var isFunction = require('../lib/helpers/is-function.js');
var extendDefaults = require('../lib/helpers/extend-defaults.js');

var makeResetFunction = require('./helpers/reset.js');
var clearSubcompanies = require('../script/clear-subcompanies.js');
var clearUsers = require('../script/clear-users.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch = new AnyFetch(configuration.test.login, configuration.test.password);
  var cleaner = makeResetFunction(anyfetch);

  describe('Basic authentication', function() {
    it('should retrieve token from credentials', function(done) {
      anyfetch.getToken(function(err, res) {
        should(res).be.ok;
        should(res.body).be.ok;
        res.body.should.have.keys(['token']);
        done(err);
      });
    });
  });

  var testEndpoint = function(name) {
    describe(name, function() {
      var expected = configuration.apiDescriptors[name];
      var res = null;

      it('should carry out the request', function(done) {
        anyfetch[name](function(e, r) {
          res = r;
          done(e);
        });
      });

      it('should use the correct verb', function() {
        res.req.method.should.equal(expected.verb);
      });

      it('should target the correct endpoint', function() {
        res.req.path.should.equal(expected.endpoint);
      });

      it('should have the expected return code', function() {
        res.res.statusCode.should.equal(expected.expectedStatus);
      });
    });
  };

  testEndpoint('getStatus');
  testEndpoint('getIndex');
  testEndpoint('getCompany');
  testEndpoint('getSubcompanies');
  testEndpoint('postCompanyUpdate');
  testEndpoint('getDocuments');
  testEndpoint('getUsers');
  testEndpoint('getDocumentTypes');
  testEndpoint('getProviders');

  describe('getBatch', function() {
    var expected = configuration.apiDescriptors.getBatch;
    var res;
    var pages = [
      '/document_types',
      '/providers'
    ];

    it('should carry out the request', function(done) {
      anyfetch.getBatch({ pages: pages }, function(e, r) {
        res = r;
        done(e);
      });
    });

    it('should use the correct verb', function() {
      res.req.method.should.equal(expected.verb);
    });

    it('should target the correct endpoint', function() {
      res.req.path.should.startWith(expected.endpoint);
    });

    it('should have the expected return code', function() {
      res.res.statusCode.should.equal(expected.expectedStatus);
    });

    it('should respond with an object with one key per page', function() {
      res.body.should.have.keys(pages);
    });
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
      before(cleaner);
      var anyfetchBearer;
      before(function() {
        anyfetchBearer = new AnyFetch(this.token);
      });

      var documentId = null;
      var fakeDocument = configuration.test.fakeDocument;
      var subFunctions;

      it('...create phony document', function(done) {

        anyfetchBearer.postDocument(fakeDocument, function(err, res) {
          documentId = res.body.id;
          subFunctions = anyfetchBearer.getDocumentById(documentId);
          done(err);
        });
      });

      it('should return synchronously an object containing only functions', function() {
        for(var i in subFunctions) {
          isFunction(subFunctions[i]).should.be.ok;
        }
      });

      it('should only accept mongo-style ids', function(done) {
        anyfetchBearer.getDocumentById('aze').getRaw(function(err) {
          should(err).not.equal(null);
          err.message.toLowerCase().should.include('argument error');
          done();
        });
      });

      describe('postFile', function() {
        it('should post file created with `fs.createReadStream`', function(done) {
          // Warning! Do not use directly the object from `config`, its scope is global!
          var hash = extendDefaults({}, configuration.test.fakeImageFile);
          hash.file = fs.createReadStream(hash.path);
          subFunctions.postFile(hash, done);
        });

        it('should post file without knowing mime-type', function(done) {
          var file = fs.createReadStream(configuration.test.fakeImageFile.path);
          subFunctions.postFile({ file: file }, done);
        });

        it('should post file from a path', function(done) {
          var filename = __dirname + '/samples/hello.md';
          subFunctions.postFile({ file: filename }, done);
        });
      });

      describe('getDocumentByIdentifier', function() {
        var documentIdentifier = fakeDocument.identifier;
        var subFunctionsByIdentifier;

        before(function retrieveSubfunctions() {
          subFunctionsByIdentifier = anyfetchBearer.getDocumentByIdentifier(documentIdentifier);
        });

        it('should offer the same functions as byId', function() {
          subFunctionsByIdentifier.should.have.keys(Object.keys(subFunctions));

          for(var i in subFunctionsByIdentifier) {
            isFunction(subFunctionsByIdentifier[i]).should.be.ok;
            subFunctions[i].should.be.ok;
          }
        });

        it('should retrieve the document with this identifier', function(done) {
          anyfetchBearer.getDocumentsByIdentifier(documentIdentifier, function(err, res) {
            should(err).be.exactly(null);
            should(res).be.ok;
            should(res.body).be.ok;
            should(res.body.identifier).be.ok;
            res.body.identifier.should.equal(documentIdentifier);
            done();
          });
        });

        it('should retrieve the document with this identifier (via the alias function as well)', function(done) {
          anyfetchBearer.getDocumentByIdentifier(documentIdentifier, function(err, res) {
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
      before(cleaner);
      var anyfetchBearer;
      before(function() {
        anyfetchBearer = new AnyFetch(this.token);
      });

      var documentId = null;
      var fakeDocument = configuration.test.fakeDocument;

      it('...create phony document', function(done) {
        anyfetchBearer.postDocument(fakeDocument, function(err, res) {
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
          doc.should.have.properties('data');
          doc.data.should.have.properties({ has_been_patched: true });

          done();
        });
      });
    });
  });

  describe('getProviderById', function() {
    it('should retrieve a single provider by its id', function(done) {
      // We use a dummy error to bail out of waterfall
      // Otherwise, it might cause a leak
      var noProvider = new Error('No provider available');

      async.waterfall([
        function getAlProviders(cb) {
          anyfetch.getProviders(cb);
        },
        function extractFirstId(res, cb) {
          var providerIds = Object.keys(res.body);
          if(!providerIds || providerIds.length < 1) {
            return cb(noProvider);
          }
          cb(null, providerIds[0]);
        },
        function getSingleProvider(id, cb) {
          anyfetch.getProviderById(id, rarity.carry(id, cb));
        },
        function checkProvider(id, res, cb) {
          var provider = res.body;
          provider.should.have.properties({ 'id': id });
          cb(null);
        }
      ], function(err) {
        // Do not fail if there's zero provider to test on
        if(err === noProvider) {
          return done();
        }
        done(err);
      });
    });
  });

  describe('> user-related functions', function() {
    before(cleaner);
    before(clearUsers);

    var userInfos = configuration.test.fakeUser;
    var newName = "My New Name";
    var userId = null;

    it('postUser', function(done) {
      anyfetch.postUser(userInfos, function(err, res) {
        userId = res.body.id;
        done(err);
      });
    });

    it('patchUserById should run smoothly', function(done) {
      var changes = {
        name: newName
      };
      anyfetch.patchUserById(userId, changes, done);
    });

    it('patchUserById should have applied the changes', function(done) {
      anyfetch.getUserById(userId, function(err, res) {
        should(err).not.be.ok;
        should(res).be.ok;
        res.body.should.have.property({ name: newName });
        done();
      });
    });

    it('deleteUserById', function(done) {
      anyfetch.deleteUserById(userId, done);
    });
  });

  describe('> subcompanies-related functions', function() {
    before(cleaner);
    before(clearSubcompanies);
    before(clearUsers);

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
