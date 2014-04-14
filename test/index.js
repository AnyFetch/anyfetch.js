'use strict';

var should = require('should');

var AnyFetchClient = require('../lib/');

var fakeAnyFetchId = 123;
var fakeAnyFetchSecret = 123;
var fakeAnyFetchToken = 123;

describe('AnyFetchClient', function() {
  process.env.ANYFETCH_SETTINGS_URL = 'http://localhost:1337';
  process.env.ANYFETCH_API_URL = 'http://localhost:1338';
  var frontServer = AnyFetchClient.debug.createTestFrontServer();
  var apiServer = AnyFetchClient.debug.createTestApiServer();
  frontServer.listen(1337);
  apiServer.listen(1338);
  after(function() {
    frontServer.close();
    apiServer.close();
  });

  var anyFetchClient = new AnyFetchClient(fakeAnyFetchId,fakeAnyFetchSecret);
  anyFetchClient.setAccessToken(fakeAnyFetchToken);

  describe('getAccessToken()', function() {
    var rawAnyFetchClient = new AnyFetchClient(fakeAnyFetchId,fakeAnyFetchSecret);
    it('should return access token', function(done) {

      rawAnyFetchClient.getAccessToken("fake_code", "fake_uri",   function(err, token) {
        should.equal(err, null);
        token.should.equal('fake_access_token');

        done();
      });
    });
  });


  describe('sendDocument()', function() {
    it('should require an accessToken', function(done) {
      var rawAnyFetchClient = new AnyFetchClient(fakeAnyFetchId,fakeAnyFetchSecret);
      rawAnyFetchClient.sendDocument({}, function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

    it('should require an identifier', function(done) {
      anyFetchClient.sendDocument({}, function(err) {
        err.toString().should.include('identifier');
        done();
      });
    });

    it('should allow for noHydrate parameter', function(done) {
      anyFetchClient.sendDocument({identifier: 'lol'}, false, function(err) {
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

      anyFetchClient.sendDocument(datas, function(err, document) {
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
      var rawAnyFetchClient = new AnyFetchClient(fakeAnyFetchId,fakeAnyFetchSecret);
      rawAnyFetchClient.sendFile('identifier', {}, function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

    it('should require config.file', function(done) {
      var fileConfig = {
      };

      anyFetchClient.sendFile('identifier', fileConfig, function(err) {
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

      anyFetchClient.sendFile('identifier', fileConfig, done);
    });
    it('should allow for deffered stream creation', function(done) {
      var fileConfig = function() {
        return {
          file: require('fs').createReadStream(__filename),
          filename: 'index.js',
        };
      };

      anyFetchClient.sendFile('identifier', fileConfig, done);
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

      anyFetchClient.sendDocumentAndFile(datas, fileConfig, function(err, document) {
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
      var rawAnyFetchClient = new AnyFetchClient(fakeAnyFetchId,fakeAnyFetchSecret);
      rawAnyFetchClient.deleteDocument('identifier', function(err) {
        err.toString().should.include('accessToken');
        done();
      });
    });

    it('should delete document', function(done) {
      anyFetchClient.deleteDocument('identifier', done);
    });
  });

  describe('encodeParentheses', function() {
    it('should encode parentheses', function(done) {
      var url = "abc(d)c((e))fg(h(i)";
      AnyFetchClient.debug.encodeParentheses(url).should.eql("abc%28d%29c%28%28e%29%29fg%28h%28i%29");
      done();
    });
  });
});
