'use strict';

var should = require('should');

var AnyFetch = require('../lib/index.js');
var createMockServer = require('../lib/test-server/index.js');
var configuration = require('../config/configuration.js');

describe('<Mock server>', function() {
  var anyfetch = new AnyFetch(configuration.test.login, configuration.test.password);
  var server;

  before(function launchMockServer(done) {
    server = createMockServer();
    var port = configuration.test.mockPort;
    server.listen(port, function() {
      var apiHost = 'http://localhost:' + port;
      console.log('Mock server running on ' + apiHost);
      anyfetch.setApiHost(apiHost);

      done();
    });
  });

  it('should respond with all the mocks we asked for', function(done) {
    var pages = ['/document_types', '/providers', '/users', '/company'];
    anyfetch.getBatch({ pages: pages }, function(err, res) {
      should(err).not.be.ok;
      should(res.body).be.ok;
      res.body.should.have.keys(pages);
      done();
    });
  });

  after(function closeMockServer() {
    server.close();
  });
});