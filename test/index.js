'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');

// Tests to write:
// getStatus()
// getCompany()
// getSubcompanyById()
// postUser()
// updateCompany()
// getDocumentById(123).getRaw()
// getDocumentById(123, cb)

describe('getStatus', function(){
  it('should send a request to the correct endpoint', function(done){
    Anyfetch.getStatus(function(err, res){
      // TODO: Test value here with should
      done();
    });
  });
});

describe('getDocumentById', function(){
  describe('subfunctions', function(){
    it('should return synchronously an object containing only functions', function(){
      var ret = Anyfetch.getDocumentById(123);
      // TODO: Test that `ret` is an object of functions
    });
  });
});