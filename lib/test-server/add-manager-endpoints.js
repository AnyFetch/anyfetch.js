'use strict';

var restify = require('restify');

var getContent = require('./helpers/get-content.js');

/**
 * These endpoints are part of manager.anyfetch.com,
 * we mock them here for convenience only.
 */
module.exports = function addManagerEndpoints(server) {
  /**
   * OAuth token exchange endpoint
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

  /**
   * Marketplace endpoint (no auth necessary)
   */
  server.get('/marketplace.json', function(req, res, next) {
    var trusted = req.params.trusted || false;
    var featured = req.params.featured || false;

    var providers = getContent('get', '/marketplace.json');
    // Filter providers as demanded
    providers = providers.filter(function(provider) {
      if(trusted && !provider.trusted) {
        return false;
      }
      if(featured && !provider.featured) {
        return false;
      }

      return true;
    });

    res.send(200, providers);
    next();
  });

  /**
   * Associate account name to access token
   */
  server.post('/access_token/account_name', function(req, res, next) {
    if (!req.body.access_token || !req.body.account_name) {
      return next(new restify.MissingParameterError('access_token and account_name are required parameters'));
    }
    res.send(204);
    next();
  });
};
