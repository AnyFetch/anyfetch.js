'use strict';

require('should');
var restify = require('restify');

var routeExists = require('../../lib/test-server/route-exists.js');

describe('<Mock server>', function() {
  // Create a dummy test server (which won't even be started)
  // We just want to test its routes
  var server = restify.createServer();
  server.get('/status', function(req, res) {
    res.send('hello');
  });
  server.post('/document_types/-docs.json', function(req, res) {
    res.send('hello');
  });
  server.del('/document_types/other-wise.json', function(req, res) {
    res.send('hello');
  });

  describe('routeExists helper function', function() {
    it('should return true for a basic existing route', function() {
      routeExists(server, 'get', '/status').should.be.ok;
    });

    it('should allow `verb` to be omitted and default to GET', function() {
      routeExists(server, '/status').should.be.ok;
    });

    it('should return true for a weird-looking existing route', function() {
      routeExists(server, 'post', '/document_types/-docs.json').should.be.ok;
      routeExists(server, 'delete', '/document_types/other-wise.json').should.be.ok;
    });

    it('should ignore the endpoint querystring', function() {
      routeExists(server, 'get', '/status?useless=true').should.be.ok;
    });

    it('should return false for an unexistant route', function() {
      routeExists(server, 'patch', '/does/not/exist').should.not.be.ok;
    });
  });
});
