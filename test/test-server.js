'use strict';

require('should');
var request = require('supertest');

var AnyFetchClient = require('../lib/');

describe('debug.createTestFrontServer()', function() {
  var server = AnyFetchClient.debug.createTestFrontServer();

  describe("POST /oauth/access_token", function() {
    it('should require code parameter', function(done) {
      request(server)
        .post('/oauth/access_token')
        .expect(409)
        .expect(/code/)
        .end(done);
    });

    it('should require client_id parameter', function(done) {
      request(server)
        .post('/oauth/access_token')
        .send({code: 123})
        .expect(409)
        .expect(/client_id/)
        .end(done);
    });

    it('should require client_secret parameter', function(done) {
      request(server)
        .post('/oauth/access_token')
        .send({code: 123, client_id: 123})
        .expect(409)
        .expect(/client_secret/)
        .end(done);
    });

    it('should return fake access token', function(done) {
      request(server)
        .post('/oauth/access_token')
        .send({code: 123, client_id: 123, client_secret: 123})
        .expect(200)
        .expect(/"fake_access_token"/)
        .end(done);
    });
  });
});

describe('debug.createTestApiServer()', function() {
  var server = AnyFetchClient.debug.createTestApiServer();

  it('should allow to override logging function', function(done) {
    var wasSeen = false;
    var cb = function(page) {
      page.should.include('/documents');
      wasSeen = true;
    };

    var logServer = AnyFetchClient.debug.createTestApiServer(cb);
    logServer.listen(7585);
    request(logServer)
      .post('/documents')
      .end(function(err) {
        if(err) {
          throw err;
        }
        if(!wasSeen) {
          throw new Error("Logging function was not called.");
        }

        logServer.close();
        done();
      });
  });

  describe("POST /documents", function() {
    it('should require identifier', function(done) {
      request(server)
        .post('/documents')
        .expect(409)
        .expect(/identifier/)
        .end(done);
    });

    it('should return all params', function(done) {
      request(server)
        .post('/documents')
        .send({identifier: 'bar'})
        .expect(200)
        .expect(/"bar"/)
        .end(done);
    });
  });

  describe("DELETE /documents", function() {
    it('should require identifier', function(done) {
      request(server)
        .del('/documents/identifier/')
        .expect(409)
        .expect(/identifier/)
        .end(done);
    });

    it('should return 204', function(done) {
      request(server)
        .del('/documents/identifier/bar')
        .expect(204)
        .end(done);
    });
  });

  describe("POST /documents/identifier/:identifier/file", function() {
    it('should require a file', function(done) {
      request(server)
        .post('/documents/identifier/some-identifier/file')
        .send({identifier: 'bar'})
        .expect(409)
        .end(done);
    });

    it('should return 204', function(done) {
      request(server)
        .post('/documents/identifier/some-identifier/file')
        .field('identifier', 'bar')
        .attach('file', __filename)
        .expect(204)
        .end(done);
    });
  });
});
