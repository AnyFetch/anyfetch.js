'use strict';

var should = require('should');
var request = require('supertest');

var AnyFetch = require('../lib/index.js');
var createMockServer = require('../lib/test-server/index.js');
var configuration = require('../config/configuration.js');
var filename = require('../lib/helpers/endpoint-filename.js');

describe('<Mock server>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  var server;
  var port = configuration.test.mockPort;
  var mockUrl = 'http://localhost:' + port;

  before(function launchMockServer(done) {
    server = createMockServer();
    server.listen(port, function() {
      console.log('Mock server running on ' + mockUrl);
      anyfetch.setApiUrl(mockUrl);

      done();
    });
  });

  /**
   * We are testing the server here, not the lib
   * That's why we send a direct request
   */
  describe('Errors', function() {
    it('should err on invalid GET parameter', function(done) {
      request(mockUrl)
        .get('/documents')
        .query({ random_key: 'random_value' })
        .expect(409)
        .expect(/not allowed/i)
        .expect(/query parameter/i)
        .end(done);
    });

    it('should err on invalid key in POST body', function(done) {
      request(mockUrl)
        .post('/users')
        .send({ random_key: 'random_value' })
        .expect(409)
        .expect(/not allowed/i)
        .expect(/request's body/i)
        .end(done);
    });
  });

  describe('Endpoints responding with 204', function() {
    it('should return no content', function(done) {
      request(mockUrl)
        .delete('/company/reset')
        .expect(204)
        .expect(/^$/)
        .end(done);
    });
  });

  describe('Endpoints responding with 200', function() {
    it('should return some mocked content', function(done) {
      var mockName = filename({
        verb: 'GET',
        endpoint: '/'
      });
      var expectedContent = require('../lib/test-server/mocks/' + mockName + '.json');

      request(mockUrl)
        .get('/')
        .expect(200)
        .expect(expectedContent)
        .end(done);
    });
  });

  describe('GET /batch', function() {
    it('should respond with all the mocks we asked for', function(done) {
      var pages = ['/document_types', '/providers', '/users', '/company'];
      anyfetch.getBatch({ pages: pages }, function(err, res) {
        should(err).not.be.ok;
        should(res.body).be.ok;
        res.body.should.have.keys(pages);
        done();
      });
    });
  });

  after(function closeMockServer() {
    server.close();
  });
});
