'use strict';

require('should');
var async = require('async');

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

before(function(done) {
  // Delete previous tests artifacts
  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
  cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);
  
  var datas = {
    identifier: 'test-identifier',
  };
  cluestrClient.deleteDocument(datas.identifier, function(err) {
    // No error checking, since we can't know for sure if old documents are present.
    done();
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
    cluestrClient.sendDocument({}, false, function(err) {
      err.toString().should.include('identifier');
      done();
    });
  });

  it('should send document', function(done) {
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

  it('should update document with same identifier', function(done) {
    var datas = {
      identifier: 'test-identifier',
      binary_document_type: 'file',
      metadatas: {
        'foo': 'bar'
      },
    };

    var documentId = null;
    async.series([
      function(cb) {
        cluestrClient.sendDocument(datas, function(err, document) {
          if(err) {
            throw err;
          }

          documentId = document.id;
          cb();
        });
      },
      function(cb) {
        datas.metadatas.foo2 ="bar2";
        cluestrClient.sendDocument(datas, function(err, document) {
          if(err) {
            throw err;
          }

          document.should.have.property('id', documentId);
          document.should.have.property('metadatas');
          document.metadatas.should.eql(datas.metadatas);

          cb();
        });
      }
    ], done);
  });
});


describe('deleteDocument()', function() {
  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
  cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);
  
  var datas = {
    identifier: 'test-identifier',
    binary_document_type: 'file',
    metadatas: {
      'foo': 'bar'
    },
  };

  var documentId = null;

  beforeEach(function(done) {
    cluestrClient.sendDocument(datas, function(err, document) {
      if(err) {
        throw err;
      }

      documentId = document.id;
      
      done();
    });
  });

  it('should delete document', function(done) {
    cluestrClient.deleteDocument(datas.identifier, function(err) {
      if(err) {
        throw err;
      }

      // Sending the same data again should now create a new document
      cluestrClient.sendDocument(datas, function(err, document) {
        if(err) {
          throw err;
        }

        document.id.should.not.equal(documentId);
        done();
      });

    });
  });
});
