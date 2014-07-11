'use strict';

var should = require('should');
var request = require('supertest');
var async = require('async');

var AnyFetch = require('../../lib/index.js');
var configuration = require('../../config/configuration.js');

describe('<Mock server customization>', function() {
  var endpoint = '/status';
  var overridenContent = require('../samples/mock.json');

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

  var checkoverriden = function(expected, done) {
    if(!done) {
      done = expected;
      expected = overridenContent;
    }

    mockRequest.get(endpoint)
      .expect(200)
      .expect(expected)
      .end(done);
  };

  describe('Overriding', function() {
    it('should serve overriden JSON', function(done) {
      server.override('get', endpoint, overridenContent);
      checkoverriden(done);
    });

    it('should serve overriden JSON from filename', function(done) {
      var filename = __dirname + '/../samples/mock.json';
      server.override('get', endpoint, filename);
      checkoverriden(done);
    });

    it('should override GET by default', function(done) {
      var filename = __dirname + '/../samples/mock.json';
      server.override(endpoint, filename);
      checkoverriden(done);
    });

    it('should ignore endpoint querystring', function(done) {
      var url = endpoint + '?useful=false&nonsense[0]=true';
      server.override(url, overridenContent);
      mockRequest.get(url)
        .expect(200)
        .expect(overridenContent)
        .end(done);
    });

    it('should be able to override /oauth/access_token as well', function(done) {
      server.override('post', '/oauth/access_token', overridenContent);

      var data = {
        client_id: 'chuck_norris',
        client_secret: 'no_need',
        code: '1234',
        grant_type: 'authorization_code'
      };
      mockRequest.post('/oauth/access_token')
        .send(data)
        .expect(200)
        .expect(overridenContent)
        .end(done);
    });
  });

  describe('Restoring', function() {
    it('should restore a single endpoint', function(done) {
      server.override(endpoint, overridenContent);
      server.restore(endpoint);
      mockRequest.get(endpoint)
        .expect(200)
        .expect(function(res) {
          should(res.body).be.ok;
          res.body.should.not.have.properties(overridenContent);
        })
        .end(done);
    });

    it('should restore all endpoints', function(done) {
      server.override('/status', overridenContent);
      server.override('/providers', overridenContent);
      server.restore();

      async.parallel({
        'status': function status(cb) {
          mockRequest.get('/status')
            .expect(200)
            .expect(function(res) {
              should(res.body).be.ok;
              res.body.should.not.have.properties(overridenContent);
            })
            .end(cb);
        },
        'providers': function providers(cb) {
          mockRequest.get('/providers')
            .expect(200)
            .expect(function(res) {
              should(res.body).be.ok;
              res.body.should.not.have.properties(overridenContent);
            })
            .end(cb);
        }
      }, done);
    });
  });

  describe('Edge cases', function() {
    it('should err when overriding GET /batch', function() {
      try {
        server.override('/batch', overridenContent);
      } catch(e) {
        should(e).be.ok;
        e.message.should.match(/cannot override \/batch/i);
      }
    });

    it('should err when overriding unknown HTTP verb', function() {
      try {
        server.override('PONY', '/batch', overridenContent);
      } catch(e) {
        should(e).be.ok;
        e.message.should.match(/unknown http verb/i);
      }
    });

    it('should still serve no content on 204 endpoints', function(done) {
      server.override('delete', '/token', overridenContent);
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
