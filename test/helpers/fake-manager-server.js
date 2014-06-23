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
    expected.forEach(function(param) {
      if(!req.params[param]) {
        return res.send(new restify.MissingParameterError('Missing parameter ' + param));
      }
    });

    if(req.params.client_id !== configuration.test.fakeAppId) {
      return res.send(new restify.ResourceNotFoundError('Application ' + req.params.client_id + ' not found.'));
    }
    if(req.params.client_secret !== configuration.test.fakeAppSecret) {
      return res.send(new restify.InvalidCredentialsError('Invalid client_secret'));
    }

    var body = {
      token_type: 'bearer',
      access_token: configuration.test.fakeAccessToken
    };
    res.send(200, body);
  });

  return server;
};