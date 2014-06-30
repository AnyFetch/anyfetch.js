'use strict';

var restify = require('restify');

var filename = require('../helpers/endpoint-filename.js');
var configuration = require('../../config/configuration.js');

module.exports = function createTestServer() {
  var server = restify.createServer();
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  var respondTo = function(config) {
    var endpoint = config.endpoint;
    if(config.requireId) {
      endpoint = endpoint.replace('{id}', ':id');
    }
    if(config.requireIdentifier) {
      endpoint = endpoint.replace('{identifier}', ':identifier');
    }

    server[config.method](endpoint, function(req, res, next) {
      var key;
      // Check that the request is valid
      if(config.params) {
        for(key in req.query) {
          if(config.params.indexOf(key) === -1) {
            return next(new restify.InvalidArgumentError('Key `' + key + '` is not allowed in this request\'s query parameters'));
          }
        }
      }
      if(config.body) {
        for(key in req.body) {
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

    // We'll override `GET /batch`
    if(config.endpoint !== '/batch') {
      respondTo(config);
    }

    if(config.subFunctions) {
      Object.keys(config.subFunctions).forEach(function(name) {
        var subConfig = config.subFunctions[name];
        respondTo(subConfig);
      });
    }
  });

  /**
   * Custom response to GET /batch
   * We craft the response from each asked endpoint.
   */
  server.get('/batch', function(req, res) {
    var pages = req.params.pages;
    var response = {};

    pages.forEach(function(page) {
      var config = {
        verb: 'GET',
        endpoint: page
      };
      response[page] = require('./mocks/' + filename(config) + '.json');
    });

    res.send(response);
  });

  return server;
};