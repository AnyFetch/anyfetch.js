'use strict';

require('should');

var CluestrClient = require('../lib/cluestr.js/index.js');

/**
 * Check environment is set up.
 */
before(function() {
  var keys = ['CLUESTR_ID', 'CLUESTR_SECRET', 'ACCESS_TOKEN'];
  keys.forEach(function(key) {
    if(!process.env[key]) {
      throw new Error("To run this test suite, you need to specify environment variable " + key);
    }
  });
});


describe('getAccessToken()', function() {
  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
  it('should crash on invalid values', function(done) {

    cluestrClient.getAccessToken("fake_code", "fake_uri",   function(err) {
      err.toString().should.include('401');
      err.toString().should.include('The provided authorization grant is invalid');

      done();
    });
  });
});


describe('sendDocument()', function() {
  it('should require an accessToken', function(done) {
    var rawCluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
    rawCluestrClient.sendDocument({}, function(err) {
      err.toString().should.include('accessToken');
      done();
    });
  });

  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
  cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);

  it('should require an identifier', function(done) {
    cluestrClient.sendDocument({}, function(err) {
      err.toString().should.include('identifier');
      done();
    });
  });

  it('should allow for noHydrate parameter', function(done) {
    cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);
    cluestrClient.sendDocument({}, false, function(err) {
      err.toString().should.include('identifier');
      done();
    });
  });

  it('should work as documented', function(done) {
    cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);

    var datas = {
      identifier: 'test-identifier',
      binary_document_type: 'file',
      metadatas: {
        'foo': 'bar'
      },
    };

    cluestrClient.sendDocument(datas, function(err, document) {
      if(err) {
        throw err;
      }
      document.should.have.property('_type', 'Document');
      document.should.have.property('binary_document_type', '5252ce4ce4cfcd16f55cfa3b');
      document.should.have.property('metadatas');
      document.metadatas.should.eql(datas.metadatas);

      done();
    });
  });
});
