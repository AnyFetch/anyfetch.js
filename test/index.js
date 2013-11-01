'use strict';

var should = require('should');

var CluestrClient = require('../lib/cluestr.js/index.js');

var fakeCluestrId = 123;
var fakeCluestrSecret = 123;
var fakeCluestrToken = 123;

describe('CluestrClient', function() {
  process.env.CLUESTR_FRONT = 'http://localhost:1337';
  process.env.CLUESTR_SERVER = 'http://localhost:1338';
  CluestrClient.debug.createTestFrontServer().listen(1337);
  CluestrClient.debug.createTestApiServer().listen(1338);

  describe('getAccessToken()', function() {
    var cluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
    it('should return access token', function(done) {

      cluestrClient.getAccessToken("fake_code", "fake_uri",   function(err, token) {
        should.equal(err, null);
        token.should.equal('fake_access_token');

        done();
      });
    });
  });


  describe('sendDocument()', function() {
    var cluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
    cluestrClient.setAccessToken(fakeCluestrToken);

    it('should require an accessToken', function(done) {
      var rawCluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
      rawCluestrClient.sendDocument({}, function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

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

        document.should.eql(datas);

        done();
      });
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

    it('should forward errors when deleting document', function(done) {
      var datas = {
        'identifier': 'nonexisting-document'
      };

      cluestrClient.deleteDocument(datas.identifier, function(err) {
        err.toString().should.include('404');
        done();
      });
    });
  });
});
