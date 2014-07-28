'use strict';

var url = require('url');
var fs = require('fs');

var filename = require('../../helpers/endpoint-filename.js');
var safeVerb = require('../../helpers/safe-verb.js');
var customize = require('../customize.js');
var isFunction = require('../../helpers/is-function.js');


/**
 * Get the content to serve for this endpoint.
 * Could be either overriden JSON from the user, or default JSON from ./mocks
 * @return {JSON}
 */
module.exports = function getContent(verb, endpoint, req, res, next) {
  verb = safeVerb(verb);

  // Clear the querystring
  var parsed = url.parse(endpoint);
  endpoint = parsed.pathname;

  var overriden = customize.overriden;
  if(overriden[verb] && overriden[verb][endpoint]) {
    if(isFunction(overriden[verb][endpoint])) {
      overriden[verb][endpoint](req, res, next);
      return true;
    }
    else {
      res.send(overriden[verb][endpoint]);
      next();
      return true;
    }
  }

  var file = __dirname + '/../mocks/' + filename(verb, endpoint) + '.json';
  if(!fs.existsSync(file)) {
    return false;
  }

  res.send(require(file));
  next();
  return true;
};
