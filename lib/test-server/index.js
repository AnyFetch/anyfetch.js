'use strict';

var restify = require('restify');

var configuration = require('../../config/configuration.js');
var customize = require('./customize.js');
var hasCustomResponder = require('./helpers/has-custom-responder.js');
var getResponder = require('./helpers/get-responder.js');

var addSpecificEndpoints = require('./add-specific-endpoints.js');
var addManagerEndpoints = require('./add-manager-endpoints.js');

var respondTo = function(server, config) {
  var endpoint = config.endpoint;
  if(config.requireId) {
    endpoint = endpoint.replace('{id}', ':id');
  }
  if(config.requireIdentifier) {
    endpoint = endpoint.replace('{identifier}', ':identifier');
  }

  server[config.method](endpoint, function(req, res, next) {
    // We allow the user to bypass our verifications
    if(hasCustomResponder(config.verb, req.url)) {
      return getResponder(config.verb, req.url)(req, res, next);
    }
    if(hasCustomResponder(config.verb, endpoint)) {
      return getResponder(config.verb, endpoint)(req, res, next);
    }

    // If we're handling the response ourselves (i.e. no overriden
    // responder function from the user), check the validity of the request
    var key;
    // Check that the request is valid
    if(config.params && !config.noCheckParams) {
      for(key in req.query) {
        if(config.params.indexOf(key) === -1) {
          return next(new restify.InvalidArgumentError('Key `' + key + '` is not allowed in this request\'s query parameters'));
        }
      }
    }
    if(config.body && !config.noCheckBody) {
      for(key in req.body) {
        if(config.body.indexOf(key) === -1) {
          return next(new restify.InvalidArgumentError('Key `' + key + '` is not allowed in this request\'s body'));
        }
      }
    }

    var responder = getResponder(config.verb, req.url, config.expectedStatus) || getResponder(config.verb, endpoint, config.expectedStatus);

    // Still not found
    if(!responder) {
      responder = function serveNotFound(req, res, next) {
        res.send(404, new restify.NotFoundError('Not found: no mock found for ' + config.verb + ' ' + endpoint));
        return next();
      };
    }

    return responder(req, res, next);
  });
};

module.exports = function createMockServer() {
  var server = restify.createServer();
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  Object.keys(configuration.apiDescriptors).forEach(function(name) {
    var config = configuration.apiDescriptors[name];

    // We'll override `GET /batch` (see addSpecificEndpoints)
    if(config.endpoint !== '/batch') {
      respondTo(server, config);
    }

    if(config.subFunctions) {
      Object.keys(config.subFunctions).forEach(function(name) {
        var subConfig = config.subFunctions[name];
        respondTo(server, subConfig);
      });
    }
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
