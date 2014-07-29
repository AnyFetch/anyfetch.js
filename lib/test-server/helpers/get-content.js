'use strict';

var url = require('url');
var fs = require('fs');

var filename = require('../../helpers/endpoint-filename.js');
var safeVerb = require('../../helpers/safe-verb.js');
var customize = require('../customize.js');

/**
 * Get the content to serve at this endpoint.
 * It could be:
 * - overriden JSON from the user
 * - default JSON from ./mocks
 *
 * @param {String} verb
 * @param {String} endpoint
 * @return {Object} JSON or null if none is found
 *
 * @warning We assume here that `overriden` cannot contain functions,
 * this case must be handled beforehand.
 */
module.exports = function getResponder(verb, endpoint) {
  verb = safeVerb(verb);

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  var overriden = customize.overriden;
  if(overriden[verb] && overriden[verb][endpoint]) {
    return overriden[verb][endpoint];
  }

  // Fallback to default JSON
  var file = __dirname + '/../mocks/' + filename(verb, endpoint) + '.json';
  // TODO: replace with try / catch on the `require`?
  if(!fs.existsSync(file)){
    return null;
  }
  return require(file);
};
