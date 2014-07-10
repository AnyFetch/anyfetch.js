'use strict';

var restify = require('restify');

var filename = require('../helpers/endpoint-filename.js');
var safeVerb = require('../helpers/safe-verb.js');
var configuration = require('../../config/configuration.js');
var customize = require('./customize.js');
var overriden = customize.overriden;

/**
 * Get the content to serve for this endpoint.
 * Could be either overriden JSON from the user, or default JSON from ./mocks
 * @return {JSON}
 */
var getContent = function(verb, endpoint) {
  verb = safeVerb(verb);

  if(overriden[verb] && overriden[verb][endpoint]) {
    return overriden[verb][endpoint];
  }
  else {
    var json = require(__dirname + '/mocks/' + filename(verb, endpoint) + '.json');
    return json;
  }
};

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
        res.send(204);
      }
      // Some mocked content
      else {
        var json = getContent(config.verb, endpoint);
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

    pages.forEach(function(page) {
      response[page] = getContent('get', page);
    });

    res.send(response);
    next();
  });

  /**
   * OAuth token exchange endpoint
   * @warning This is usually an endpoint of manager.anyfetch.com, we mock it
   *          here for convenience only.
   */
  server.post('/oauth/access_token', function(req, res, next) {
    var expectedKeys = ['client_id', 'client_secret', 'code', 'grant_type'];
    expectedKeys.forEach(function(key) {
      if(!req.params[key]) {
        return next(new restify.InvalidArgumentError('Parameter `' + key + '` is missing'));
      }
    });

    if(req.params.grant_type !== 'authorization_code') {
      return next(new restify.InvalidArgumentError('Unsupported grant_type ' + req.params.grant_type + ', expected "authorization_code"'));
    }

    var json = getContent('post', '/oauth/access_token');
    res.send(200, json);
    next();
  });

  // Endpoint overriding functions
  server.override = customize.override;
  server.restore = customize.restore;

  return server;
};
