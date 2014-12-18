'use strict';

var restify;
try {
  restify = require('restify');
}
catch(e) {
  // No restify.
}
var url = require('url');

var safeVerb = require('../helpers/safe-verb.js');
var routeExists = require('./helpers/route-exists.js');
var getResponder = require('./helpers/get-responder.js');

/**
 * Object in which we'll store the overriden endpoints.
 *   each verb => { endpoint => JSON }
 */
var overriden = {};
var verbs = ['get', 'post', 'del', 'options', 'head', 'put', 'trace', 'connect'];
verbs.map(function(verb) {
  overriden[verb] = {};
});

/**
 * Load the current responder for a customized endpoint
 */
var responseWrapper = function responseWrapper(verb, endpoint) {
  return function wrapper(req, res, next) {
    var responder = getResponder(verb, endpoint);
    if(!responder) {
      res.send(new restify.NotFoundError('No mock for ' + verb + ' ' + endpoint));
      return next();
    }

    responder(req, res, next);
  };
};

/**
 * Allow the user to choose which JSON to serve.
 * You can only override existing endpoints.
 * @param {String} [verb] HTTP verb to override. Defaults to 'get'.
 * @param {String} endpoint Endpoint to override. We ignore any querystring.
 * @param {Object|String|Function} content
 *        Either the JSON to respond with,
 *        or the path to a file containing the JSON to serve
 *        or a function `respond(req, res, next)` which is responsible for writing the response
 * @warning `GET /batch` cannot be overriden, its response is constructed from the various requested endpoints.
 */
module.exports.override = function override(verb, endpoint, content) {
  if(!content) {
    content = endpoint;
    endpoint = verb;
    verb = 'GET';
  }
  verb = safeVerb(verb);

  if(!(verb in overriden)) {
    throw new Error('Unknown HTTP verb ' + verb);
  }

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  // GET /batch is constructed from the other endpoints, thus it cannot be overriden
  if(endpoint === '/batch') {
    throw new Error('Cannot override /batch, should override each endpoint individually');
  }

  // If we were passed a filename, get the associated JSON
  if(typeof content === 'string' || content instanceof String) {
    content = require(content);
  }

  overriden[verb][endpoint] = content;

  // Dynamically create a route on the server if needed
  if(this && !routeExists(this, verb, endpoint)) {
    this[verb](endpoint, responseWrapper(verb, endpoint));
  }
};

/**
 * Unmount overriden JSON for this endpoint, if any.
 * The next request to this endpoint will serve the default JSON.
 * @param {String} endpoint Endpoint to restore. We ignore any querystring.
 * @param {String} [verb] HTTP verb to override. Defaults to 'get'.
 * Call with no argument to restore all endpoints.
 */
module.exports.restore = function restore(verb, endpoint) {
  // Restore all
  if(!verb && !endpoint) {
    Object.keys(overriden).forEach(function restoreVerb(verb) {
      overriden[verb] = {};
    });
    return;
  }

  if(!endpoint) {
    endpoint = verb;
    verb = 'get';
  }
  verb = safeVerb(verb);

  // Restore a specific existing endpoint
  if(overriden[verb] && overriden[verb][endpoint]) {
    delete overriden[verb][endpoint];
  }
};

module.exports.overriden = overriden;
