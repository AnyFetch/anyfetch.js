'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');
var isFunction = require('../lib/helpers/is-function.js');

// Tests to write:
// getSubcompanyById()
// postUser()
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
    var subFunctions = Anyfetch.getDocumentById(123);
    var subFunctionsByIdentifier = Anyfetch.getDocumentByIdentifier('aze');

    it('should return synchronously an object containing only functions', function(){
      for(var i in subFunctions) {
        isFunction(subFunctions[i]).should.be.ok;
      }
    });

    it('should only accept mongo-style ids', function(done){
      Anyfetch.getDocumentById('aze').getRelated(function(err){
        err.message.toLowerCase().should.include('argument error');
        done();
      });
    });

    describe('getDocumentByIdentifier', function(){
      it('should offer the same functions as byId', function(){
        Object.keys(subFunctionsByIdentifier).length.should.equal(Object.keys(subFunctions).length);

        for(var i in subFunctionsByIdentifier) {
          isFunction(subFunctionsByIdentifier[i]).should.be.ok;
          subFunctions[i].should.be.ok;
        }
      });

      it('should accept any kind of identifier', function(done){
        Anyfetch.getDocumentByIdentifier('aze').getRelated(function(err){
          should(err).be.exactly(null);
          done();
        });
      });
    });

  });
});