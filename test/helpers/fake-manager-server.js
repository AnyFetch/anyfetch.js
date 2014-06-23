'use strict';

var restify = require('restify');

var configuration = require('../../config/configuration.js');

/**
 * @return A tiny restify server used to emulate the behavior of
 *         the `/oauth/access_token` of `manager.anyfetch.com`
 */
module.exports = function createServer() {
  var server = restify.createServer();
  server.use(restify.bodyParser());

  server.post('/oauth/access_token', function(req, res) {
    var expected = [
      'client_id',
      'client_secret',
      'code',
      'grant_type'
    ];

    if(req.params.client_id !== configuration.test.fakeAppId) {
      return res.send(new restify.ResourceNotFoundError('Application ' + req.params.client_id + ' not found.'));
    }
    expected.forEach(function(param) {
      if(!req.params[param]) {
        return res.send(new restify.MissingParameterError('Missing parameter ' + param));
      }
    });

    var body = {
      token_type: 'bearer',
      access_token: configuration.test.fakeAccessToken
    };
    res.send(200, body);
  });

  return server;
};