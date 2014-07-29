'use strict';

var url = require('url');

var safeVerb = require('../../helpers/safe-verb.js');
var hasCustomResponder = require('./has-custom-responder.js');
var getContent = require('./get-content.js');
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
  statusCode = statusCode || 200;

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  var overriden = customize.overriden;
  if(hasCustomResponder(verb, endpoint)) {
    // The user will respond with its own function and take the control flow
    return overriden[verb][endpoint];
  }

  if(statusCode === 204 || statusCode === 202) {
    return function serveEmpty(req, res, next) {
      res.send(statusCode);
      return next;
    };
  }

  var content = getContent(verb, endpoint);
  if(!content) {
    return null;
  }

  return function serveJSON(req, res, next) {
    res.send(statusCode, content);
    return next();
  };
};
