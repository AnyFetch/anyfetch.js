'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var isFunction = require('../lib/helpers/is-function.js');

// TODO: Tests to write
// getSubcompanyById()


describe('Anyfetch library API mapping functions', function(){
  var accessToken;
  var anyfetchBasic = new Anyfetch(configuration.login, configuration.password);

  describe('Basic authentication', function(){
    it('should retrieve token from credentials', function(done){
      anyfetchBasic.getToken(function(err, res){
        should(res.body).be.ok;
        res.body.should.have.keys(['token']);
        accessToken = res.body.token;
        done(err);
      });
    });
  });

  describe('Token authentication', function(){
    var anyfetch;

    before(function(){
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
    testEndpoint('postCompanyUpdate');
    testEndpoint('getDocuments');
    testEndpoint('getUsers');

    describe('getDocumentById & getDocumentByIdentifier subfunctions', function() {
      var documentId = null;
      var documentIdentifier = 'some_identifier';
      var subFunctions;

      before(function(){
        subFunctions = anyfetch.getDocumentById(documentId);
      });

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

      describe('getDocumentByIdentifier', function() {
        var subFunctionsByIdentifier;

        before(function(){
          subFunctionsByIdentifier = anyfetch.getDocumentByIdentifier(documentIdentifier);
        });

        it('should offer the same functions as byId', function() {
          subFunctionsByIdentifier.should.have.keys(Object.keys(subFunctions));

          for(var i in subFunctionsByIdentifier) {
            isFunction(subFunctionsByIdentifier[i]).should.be.ok;
            subFunctions[i].should.be.ok;
          }
        });

        it('should accept any kind of identifier', function(done) {
          subFunctionsByIdentifier.getRaw(function(err, res) {
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

    describe('postUser', function() {
      var config = configuration.apiDescriptors['postUsers'];
      var userId = null;

      it('should create a phony user', function(done) {
        var body = {
          email: 'chuck@norris.com',
          name: 'Chuck Norris',
          password: 'no_need',
          is_admin: false,
        };

        anyfetch.postUser(body, function(err, res) {
          userId = res.body.id;
          done(err);
        });
      });

      // Delete the phony user
      it('should delete a phony user', function(done) {
        anyfetch.deleteUserById(userId, done);
      });
    });
  });
});
