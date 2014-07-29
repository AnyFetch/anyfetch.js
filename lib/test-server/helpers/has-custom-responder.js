'use strict';

var url = require('url');

var safeVerb = require('../../helpers/safe-verb.js');
var isFunction = require('../../helpers/is-function.js');
var customize = require('../customize.js');

/**
 *
 * @param {String} verb
 * @param {String} endpoint
 * @return {Boolean} Whether the user has provided a custom responder function
 */
module.exports = function hasCustomResponder(verb, endpoint) {
  verb = safeVerb(verb);

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  var overriden = customize.overriden;
  return overriden[verb] && overriden[verb][endpoint] && isFunction(overriden[verb][endpoint]);
};
