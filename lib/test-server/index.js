'use strict';

var restify = require('restify');

var extendDefaults = require('../helpers/extend-defaults.js');

var defaultDescriptor = require('../../config/json/default-descriptor.json');
var apiDescriptors = require('../../config/json/api-descriptors.json');

var server = restify.createServer();

Object.keys(apiDescriptors).forEach(function(name) {
  var config = apiDescriptors[name];
  extendDefaults(config, defaultDescriptor);
  var verb = (config.verb === 'DELETE' ? 'del' : config.verb.toLowerCase());

  if(config.requireId) {
    config.endpoint = config.endpoint.replace('{id}', ':id');
  }
  if(config.requireIdentifier) {
    config.endpoint = config.endpoint.replace('{identifier}', ':id');
  }

  server[verb](config.endpoint, function(req, res, next) {
    // if (invalid request)
    //   next(new restify.error))

    var filename = verb + '-' + config.endpoint.replace('/', '');
    var json = require('./mocks/' + filename + '.json');
    res.send(config.expectedStatus, json);

    return next();
  });
});

module.exports = server;
