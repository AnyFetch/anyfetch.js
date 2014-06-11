'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

// Tests to write:
// getStatus()
// getCompany()
// getSubcompanyById()
// postUser()
// postCompanyUpdate()
// getDocumentById(123).getRaw()
// getDocumentById(123, cb)

var testEndpoint = function(name){

  describe(name, function(){
    describe('the request', function(){
      var expected = configuration.apiDescriptors[name];
      var r = null;

      before(function(done){
        // TODO: support id, identifier
        Anyfetch[name](function(err, res) {
          r = res;
          done(err);
        });
      });

      it('should use the correct verb', function(){
        r.req.method.should.equal(expected.verb);
      });
      it('should target the correct endpoint', function(){
        r.req.path.should.equal(expected.endpoint);
      });
      it('should have the expected return code', function(){
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

describe('getDocumentById', function(){
  describe('subfunctions', function(){
    it('should return synchronously an object containing only functions', function(){
      var ret = Anyfetch.getDocumentById(123);
      // TODO: Test that `ret` is an object of functions
    });
  });
});