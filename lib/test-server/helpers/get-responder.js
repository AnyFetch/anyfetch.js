'use strict';

var url = require('url');
var fs = require('fs');

var restify = require('restify');

var filename = require('../../helpers/endpoint-filename.js');
var safeVerb = require('../../helpers/safe-verb.js');
var isFunction = require('../../helpers/is-function.js');
var customize = require('../customize.js');

/**
 * Get the function which will respond to this endpoint.
 * It could be:
 * - a wrapper function sending overriden JSON from the user
 * - a wrapper function serving default JSON from ./mocks
 * - a custom function set by the user
 *
 * @param {String} verb
 * @param {String} endpoint
 * @param {Number} [statusCode] Will send this status code when serving JSON
 * @return {Function} respond(res, req, next) or null if 404
 */
module.exports = function getResponder(verb, endpoint, statusCode) {
  verb = safeVerb(verb);

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  var overriden = customize.overriden;
  var content;
  if(overriden[verb] && overriden[verb][endpoint]) {
    var responder = overriden[verb][endpoint];
    if(isFunction(responder)) {
      // The user will respond with its own function and take the control flow
      return responder;
    }
    content = responder;
  }

  if(statusCode === 204 || statusCode === 202) {
    return function serveEmpty(req, res, next) {
      res.send(statusCode);
      return next;
    };
  }

  if(!content) {
    // Fallback to default JSON
    var file = __dirname + '/../mocks/' + filename(verb, endpoint) + '.json';
    // TODO: replace with try / catch on the `require`?
    if(!fs.existsSync(file)){
      return null;
    }
    content = require(file);
  }

  return function serveJSON(req, res, next) {
    res.send(statusCode, content);
    return next();
  };
};
