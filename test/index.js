'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var isFunction = require('../lib/helpers/is-function.js');

// Tests to write:
// getSubcompanyById()

var testEndpoint = function(name) {

  describe(name, function() {
    describe('the request', function() {
      var expected = configuration.apiDescriptors[name];
      var r = null;

      before(function(done) {
        // TODO: support id, identifier
        Anyfetch[name](function(err, res) {
          r = res;
          done(err);
        });
      });

      it('should use the correct verb', function() {
        r.req.method.should.equal(expected.verb);
      });
      it('should target the correct endpoint', function() {
        r.req.path.should.equal(expected.endpoint);
      });
      it('should have the expected return code', function() {
        r.res.statusCode.should.equal(expected.expectedStatus);
      });
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
  var subFunctions = Anyfetch.getDocumentById(documentId);

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

    Anyfetch.postDocument(body, function(err, res) {
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
    Anyfetch.getDocumentById('aze').getRaw(function(err) {
      err.message.toLowerCase().should.include('argument error');
      done();
    });
  });

  describe('getDocumentByIdentifier', function() {
    var subFunctionsByIdentifier = Anyfetch.getDocumentByIdentifier(documentIdentifier);

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
      Anyfetch.deleteDocumentById(documentId, done);
    });
  });
});

describe('postUser', function() {
  var config = configuration.apiDescriptors['postUsers'];
  var res = null;
  var err = null;
  var userId = null;

  it('...create phony user', function(done) {
    var body = {
      email: 'chuck@norris.com',
      name: 'Chuck Norris',
      password: 'no_need',
      is_admin: false,
    };

    Anyfetch.postUser(body, function(e, r) {
      res = r;
      err = e;
      userId = res.body.id;
      done(e);
    });
  });

  it('should allow the specified body parameters', function() {
    should(err).be.exactly(null);
  });

  // Delete the phony user
  it('delete phony user...', function(done) {
    Anyfetch.deleteUserById(userId, done);
  });

});