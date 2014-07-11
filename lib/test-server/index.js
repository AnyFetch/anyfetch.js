'use strict';

var restify = require('restify');

var configuration = require('../../config/configuration.js');
var customize = require('./customize.js');
var getContent = require('./helpers/get-content.js');

var addSpecificEndpoints = require('./add-specific-endpoints.js');
var addManagerEndpoints = require('./add-manager-endpoints.js');

module.exports = function createMockServer() {
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

    server[config.method](endpoint, function(req, res, next) {
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
      if (config.expectedStatus === 204 || config.expectedStatus === 202) {
        res.send(config.expectedStatus);
      }
      // Some mocked content
      else {
        var json = getContent(config.verb, endpoint);

        if(!json) {
          res.send(new restify.NotFoundError('No mock for ' + req.url));
        }
        else {
          res.send(config.expectedStatus, json);
        }
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
   * Empty response to POST /documents/:id/file
   */
  server.post('/documents/:id/file', function(req, res, next) {
    if(!req.files || !req.files.file) {
      res.send(new restify.MissingParameterError('Missing file in request'));
      return next();
    }

    res.send(204);
    next();
  });

  /**
   * Custom response to GET /batch
   * We craft the response from each asked endpoint.
   */
  server.get('/batch', function(req, res, next) {
    if(!req.params || !req.params.pages) {
      res.send(new restify.MissingParameterError('Missing `pages` parameter'));
      return next();
    }

    var pages = req.params.pages;
    var response = {};
    var status = 200;

    pages.forEach(function(page) {
      response[page] = getContent('get', page);

      if(!response[page]) {
        response.errored = page;
        response[page] = {
          code: 'NotFound',
          message: 'No mock for ' + page
        };
        status = 404;
      }
    });

    res.send(status, response);
    next();
  });

  // Additional routes that must be coded by hand
  addSpecificEndpoints(server);
  // Additional routes taken from manager.anyfetch.com (mocked here for convenience)
  addManagerEndpoints(server);

  // Endpoint overriding functions
  server.override = customize.override;
  server.restore = customize.restore;

  return server;
};
