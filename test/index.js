'use strict';

var should = require('should');

var CluestrClient = require('../lib/');

var fakeCluestrId = 123;
var fakeCluestrSecret = 123;
var fakeCluestrToken = 123;

describe('CluestrClient', function() {
  process.env.CLUESTR_FRONT = 'http://localhost:1337';
  process.env.CLUESTR_SERVER = 'http://localhost:1338';
  CluestrClient.debug.createTestFrontServer().listen(1337);
  CluestrClient.debug.createTestApiServer().listen(1338);

  var cluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
  cluestrClient.setAccessToken(fakeCluestrToken);

  describe('getAccessToken()', function() {
    var rawCluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
    it('should return access token', function(done) {

      rawCluestrClient.getAccessToken("fake_code", "fake_uri",   function(err, token) {
        should.equal(err, null);
        token.should.equal('fake_access_token');

        done();
      });
    });
  });


  describe('sendDocument()', function() {
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
      cluestrClient.sendDocument({identifier: 'lol'}, false, function(err) {
        if(err) {
          throw err;
        }
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

  describe('sendFile()', function() {
    it('should require an accessToken', function(done) {
      var rawCluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
      rawCluestrClient.sendFile('identifier', {}, function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

    it('should require config.file', function(done) {
      var fileConfig = {
      };

      cluestrClient.sendFile('identifier', fileConfig, function(err) {
        err.toString().should.include('file');
        done();
      });
    });

    it('should send file', function(done) {
      var fileConfig = function() {
        return {
          file: new Buffer("Hello world"),
          filename: 'index.js',
        };
      };

      cluestrClient.sendFile('identifier', fileConfig, done);
    });
    it('should allow for deffered stream creation', function(done) {
      var fileConfig = function() {
        return {
          file: require('fs').createReadStream(__filename),
          filename: 'index.js',
        };
      };

      cluestrClient.sendFile('identifier', fileConfig, done);
    });
  });

  describe('sendDocumentAndFile()', function() {
    it('should return document', function(done) {
      var datas = {
        identifier: 'test-identifier',
        document_type: 'file',
        metadatas: {
          'foo': 'bar'
        },
      };

      var fileConfig = function() {
        return {
          file: require('fs').createReadStream(__filename),
          filename: 'index.js',
        };
      };

      cluestrClient.sendDocumentAndFile(datas, fileConfig, function(err, document) {
        if(err) {
          throw err;
        }

        document.should.eql(datas);
        done();
      });
    });
  });

  describe('deleteDocument()', function() {
    it('should require an accessToken', function(done) {
      var rawCluestrClient = new CluestrClient(fakeCluestrId,fakeCluestrSecret);
      rawCluestrClient.deleteDocument('identifier', function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

    it('should delete document', function(done) {
      cluestrClient.deleteDocument('identifier', done);
    });
  });
});
