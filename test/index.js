'use strict';

var should = require('should');
var fs = require('fs');
var async = require('async');
var rarity = require('rarity');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var isFunction = require('../lib/helpers/is-function.js');

// TODO: test all aliases

describe('<Anyfetch library API mapping functions>', function() {
  var accessToken;
  var anyfetchBasic = new Anyfetch(configuration.test.login, configuration.test.password);

  describe('Basic authentication', function() {
    it('should retrieve token from credentials', function(done) {
      anyfetchBasic.getToken(function(err, res) {
        should(res).be.ok;
        should(res.body).be.ok;
        res.body.should.have.keys(['token']);
        accessToken = res.body.token;
        done(err);
      });
    });
  });

  describe('Token authentication', function() {
    var anyfetch;

    before(function() {
      anyfetch = new Anyfetch(accessToken);
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

    describe('getDocumentById & getDocumentByIdentifier subfunctions', function() {
      var documentId = null;
      var documentIdentifier = 'some_identifier';
      var subFunctions;

      it('...create phony document', function(done) {
        var body = {
          identifier: documentIdentifier,
          document_type: 'file',
          data: {
            foo: 'some_string'
          },
          metadata: {
            some_key: 'some random sentence'
          }
        };

        anyfetch.postDocument(body, function(err, res) {
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

      it('should only accept mongo-style ids', function(done) {
        anyfetch.getDocumentById('aze').getRaw(function(err) {
          should(err).not.equal(null);
          err.message.toLowerCase().should.include('argument error');
          done();
        });
      });

      describe('postFile', function() {
        var hash = configuration.test.fakeImageFile;

        it('should post file created with `fs.createReadStream`', function(done) {
          hash.file = fs.createReadStream(hash.path);
          subFunctions.postFile(hash, done);          
        });

        it('should post file without knowing mime-type', function(done) {
          var file = fs.createReadStream(hash.path);
          subFunctions.postFile({ file: file }, done);          
        });
      });

      describe('getDocumentByIdentifier', function() {
        var subFunctionsByIdentifier;

        before(function() {
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
        
        // Delete phony document
        it('...delete phony document', function(done) {
          anyfetch.deleteDocumentById(documentId, done);
        });
      });
    });

    var userInfos = {
      email: 'chuck' + Math.round(Math.random() * 42) + '@norris.com',
      name: 'Chuck Norris',
      password: 'no_need',
      is_admin: true
    };
    describe('postUser', function() {
      var userId = null;

      it('should create a phony user', function(done) {
        anyfetch.postUser(userInfos, function(err, res) {
          userId = res.body.id;
          done(err);
        });
      });

      it('should delete the phony user', function(done) {
        anyfetch.deleteUsersById(userId, done);
      });
    });

    describe('subcompanies', function() {
      var userInfos = {
        email: 'chuck' + Math.round(Math.random() * 42) + '@norris.com',
        name: 'Chuck Norris',
        password: 'no_need',
        is_admin: true
      };
      var companyInfos = {
        name: 'the-fake-company'
      };
      var userId = null;
      var subcompanyId = null;

      before(function(done) {
        // Setup: an admin user who will be named admin of the new subcompany
        anyfetch.postUser(userInfos, function(err, res) {
          userId = res.body.id;
          done(err);
        });
      });

      it('should create a subcompany as the new user', function(done) {
        var chuckFetch = new Anyfetch(userInfos.email, userInfos.password);
        chuckFetch.postSubcompanies(companyInfos, function(err, res) {
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
});
