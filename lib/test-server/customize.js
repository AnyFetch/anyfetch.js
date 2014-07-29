'use strict';

var restify = require('restify');
var url = require('url');

var safeVerb = require('../helpers/safe-verb.js');
var routeExists = require('./helpers/route-exists.js');
var getContent = require('./helpers/get-content.js');
var isFunction = require('../helpers/is-function.js');

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
 * Function used to respond to arbitrary user-added endpoints.
 * We simply return 200 with some mocked content
 * until the endpoint is restored by the user, at which point
 * it will respond with 404.
 */
var simpleResponder = function simpleResponder(verb, endpoint) {
  return function simpleResponse(req, res, next) {
    var content = getContent(verb, endpoint);
    if(!content) {
      res.send(new restify.NotFoundError('No mock for ' + verb + ' ' + endpoint));
    }
    else {
      res.send(200, content);
    }
    next();
  };
};

/**
 * Allow the user to choose which JSON to serve.
 * You can only override existing endpoints.
 * @param {String} [verb] HTTP verb to override. Defaults to 'get'.
 * @param {String} endpoint Endpoint to override. We ignore any querystring.
 * @param {Object|String} content Either the JSON to respond with,
 *                                or the path to a file containing the JSON to serve
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

  if(this && !routeExists(this, verb, endpoint)) {
    if(isFunction(content)) {
      this[verb](endpoint, content);
    }
    else {
      this[verb](endpoint, simpleResponder(verb, endpoint));
    }
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
