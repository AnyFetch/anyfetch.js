'use strict';

var restify = require('restify');

var configuration = require('../../config/configuration.js');

var server = restify.createServer();

Object.keys(configuration.apiDescriptors).forEach(function(name) {
  var config = configuration.apiDescriptors[name];

  if(config.requireId) {
    config.endpoint = config.endpoint.replace('{id}', ':id');
  }
  if(config.requireIdentifier) {
    config.endpoint = config.endpoint.replace('{identifier}', ':identifier');
  }

  server[config.method](config.endpoint, function(req, res, next) {
    // TODO
    // if (invalid request)
    //   next(new restify.error))

    // No content
    if (config.expectedStatus === 204) {
      res.send(204);
    }
    // Some mocked content
    else {
      var filename = config.method + '-' + config.endpoint.replace('/', '');
      var json = require('./mocks/' + filename + '.json');
      res.send(config.expectedStatus, json);
    }

    return next();
  });
});

module.exports = server;
