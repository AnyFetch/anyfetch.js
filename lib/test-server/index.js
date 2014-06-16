'use strict';

var restify = require('restify');

var filename = require('../helpers/endpoint-filename.js');
var configuration = require('../../config/configuration.js');

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());

var respondTo = function(config) {
  if(config.requireId) {
    config.endpoint = config.endpoint.replace('{id}', ':id');
  }
  if(config.requireIdentifier) {
    config.endpoint = config.endpoint.replace('{identifier}', ':identifier');
  }

  server[config.method](config.endpoint, function(req, res, next) {
    // Check that the request is valid
    if(config.params) {
      for(var key in req.query) {
        if(config.params.indexOf(key) === -1) {
          return next(new restify.InvalidArgumentError('Key `' + key + '` is not allowed in this request\'s query parameters'));
        }
      }
    }
    if(config.body) {
      for(var key in req.body) {
        if(config.body.indexOf(key) === -1) {
          return next(new restify.InvalidArgumentError('Key `' + key + '` is not allowed in this request\'s body'));
        }
      }
    }

    // No content
    if (config.expectedStatus === 204) {
      res.send(204);
    }
    // Some mocked content
    else {
      var json = require('./mocks/' + filename(config) + '.json');
      res.send(config.expectedStatus, json);
    }

    return next();
  });
};

Object.keys(configuration.apiDescriptors).forEach(function(name) {
  var config = configuration.apiDescriptors[name];

  respondTo(config);

  if(config.subFunctions) {
    Object.keys(config.subFunctions).forEach(function(name) {
      var subConfig = config.subFunctions[name];
      respondTo(subConfig);
    });
  }
});

module.exports = server;
