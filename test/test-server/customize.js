'use strict';

var should = require('should');
var request = require('supertest');
var async = require('async');

var AnyFetch = require('../../lib/index.js');
var configuration = require('../../config/configuration.js');

describe('<Mock server customization>', function() {
  var endpoint = '/status';
  var overridedContent = require('../samples/mock.json');

  var anyfetch = new AnyFetch('email', 'password');

  var server;
  var port = configuration.test.mockPort;
  var mockUrl = 'http://localhost:' + port;
  var mockRequest = request(mockUrl);

  before(function launchMockServer(done) {
    server = AnyFetch.createMockServer();
    server.listen(port, function() {
      console.log('Mock server running on ' + mockUrl);
      AnyFetch.setManagerUrl(mockUrl);
      anyfetch.setApiUrl(mockUrl);

      done();
    });
  });

  afterEach(function restoreAll() {
    server.restore();
  });

  var checkOverrided = function(expected, done) {
    if(!done) {
      done = expected;
      expected = overridedContent;
    }

    mockRequest.get(endpoint)
      .expect(200)
      .expect(expected)
      .end(done);
  };

  describe('Endpoint overriding', function() {
    it('should override and restore smoothly', function(done) {
      server.override('get', '/status', overridedContent);
      server.restore('get', '/status');
      done();
    });

    it('should serve overrided JSON', function(done) {
      server.override('get', endpoint, overridedContent);
      checkOverrided(done);
    });

    it('should serve overrided JSON from filename', function(done) {
      var filename = __dirname + '/../samples/mock.json';
      server.override('get', endpoint, filename);
      checkOverrided(done);
    });

    it('should override GET by default', function(done) {
      var filename = __dirname + '/../samples/mock.json';
      server.override(endpoint, filename);
      checkOverrided(done);
    });

    it('should ignore querystring of endpoint', function(done) {
      server.override(endpoint + '?useful=false&nonsense[0]=true', overridedContent);
      checkOverrided(done);
    });

    it('should restore a single endpoints', function(done) {
      server.override(endpoint, overridedContent);
      server.restore(endpoint);
      mockRequest.get(endpoint)
        .expect(200)
        .expect(function(res) {
          should(res.body).be.ok;
          res.body.should.not.have.properties(overridedContent);
        })
        .end(done);
    });

    it('should restore all endpoints', function(done) {
      server.override('/status', overridedContent);
      server.override('/providers', overridedContent);
      server.restore();

      async.parallel({
        'status': function status(cb) {
          mockRequest.get('/status')
            .expect(200)
            .expect(function(res) {
              should(res.body).be.ok;
              res.body.should.not.have.properties(overridedContent);
            })
            .end(cb);
        },
        'providers': function providers(cb) {
          mockRequest.get('/providers')
            .expect(200)
            .expect(function(res) {
              should(res.body).be.ok;
              res.body.should.not.have.properties(overridedContent);
            })
            .end(cb);
        }
      }, done);
    });

    it('should err when overriding GET /batch', function() {
      try {
        server.override('/batch', overridedContent);
      } catch(e) {
        should(e).be.ok;
        e.message.should.match(/cannot override \/batch/i);
      }
    });

    it('should err when overriding unknown HTTP verb', function() {
      try {
        server.override('PONEY', '/batch', overridedContent);
      } catch(e) {
        should(e).be.ok;
        e.message.should.match(/unknown http verb/i);
      }
    });

    it('should still serve no content on 204 endpoints', function(done) {
      server.override('delete', '/token', overridedContent);
      mockRequest.delete('/token')
        .expect(204)
        .expect(function(res) {
          should(res.body).be.empty;
        })
        .end(done);
    });
  });

  after(function closeMockServer() {
    server.close();
  });
});
