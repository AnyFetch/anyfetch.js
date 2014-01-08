'use strict';

require('should');
var request = require('supertest');

var CluestrClient = require('../lib/');

describe('debug.createTestFrontServer()', function() {
  var server = CluestrClient.debug.createTestFrontServer().listen(1337);

  describe("POST /oauth/token", function() {
    it('should require code parameter', function(done) {
      request(server)
        .post('/oauth/token')
        .expect(409)
        .expect(/code/)
        .end(done);
    });

    it('should require client_id parameter', function(done) {
      request(server)
        .post('/oauth/token')
        .send({code: 123})
        .expect(409)
        .expect(/client_id/)
        .end(done);
    });

    it('should require client_secret parameter', function(done) {
      request(server)
        .post('/oauth/token')
        .send({code: 123, client_id: 123})
        .expect(409)
        .expect(/client_secret/)
        .end(done);
    });

    it('should return fake access token', function(done) {
      request(server)
        .post('/oauth/token')
        .send({code: 123, client_id: 123, client_secret: 123})
        .expect(200)
        .expect(/"fake_access_token"/)
        .end(done);
    });
  });
});

describe('debug.createTestApiServer()', function() {
  var server = CluestrClient.debug.createTestApiServer().listen(1337);

  describe("POST /providers/documents", function() {
    it('should require identifier', function(done) {
      request(server)
        .post('/providers/documents')
        .expect(409)
        .expect(/identifier/)
        .end(done);
    });

    it('should return all params', function(done) {
      request(server)
        .post('/providers/documents')
        .send({identifier: 'bar'})
        .expect(200)
        .expect(/"bar"/)
        .end(done);
    });
  });

  describe("DELETE /providers/documents", function() {
    it('should require identifier', function(done) {
      request(server)
        .del('/providers/documents')
        .expect(409)
        .expect(/identifier/)
        .end(done);
    });

    it('should return 204', function(done) {
      request(server)
        .del('/providers/documents')
        .send({identifier: 'bar'})
        .expect(204)
        .end(done);
    });
  });

  describe("POST /providers/documents/file", function() {
    it('should require identifier', function(done) {
      request(server)
        .post('/providers/documents/file')
        .expect(409)
        .expect(/identifier/)
        .end(done);
    });

    it('should require a file', function(done) {
      request(server)
        .post('/providers/documents/file')
        .send({identifier: 'bar'})
        .expect(409)
        .end(done);
    });

    it('should return 204', function(done) {
      request(server)
        .post('/providers/documents/file')
        .field('identifier', 'bar')
        .attach('file', __filename)
        .expect(204)
        .end(done);
    });
  });
});
