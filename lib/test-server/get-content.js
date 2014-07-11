'use strict';

var url = require('url');
var fs = require('fs');

var filename = require('../helpers/endpoint-filename.js');
var safeVerb = require('../helpers/safe-verb.js');
var customize = require('./customize.js');
var overriden = customize.overriden;

/**
 * Get the content to serve for this endpoint.
 * Could be either overriden JSON from the user, or default JSON from ./mocks
 * @return {JSON}
 */
module.exports = function getContent(verb, endpoint) {
  verb = safeVerb(verb);

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  if(overriden[verb] && overriden[verb][endpoint]) {
    return overriden[verb][endpoint];
  }

  var file = __dirname + '/mocks/' + filename(verb, endpoint) + '.json';
  if(!fs.existsSync(file)){
    return null;
  }

  return require(file);
};
