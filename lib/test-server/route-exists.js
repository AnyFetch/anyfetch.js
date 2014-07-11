'use strict';

var url = require('url');

var safeVerb = require('../helpers/safe-verb.js');

/**
 * @param {Restify server} server
 * @param {String} [verb] HTTP verb. Defaults to 'GET'
 * @param {String} route Route to test
 * @return Whether the route is already defined on this server
 */
module.exports = function routeExists(server, verb, route) {
  if(!route) {
    route = verb;
    verb = 'get';
  }

  verb = safeVerb(verb);
  // Restify function naming conventions...
  verb = (verb === 'del' ? 'delete' : verb);

  // Clear the querystring
  var parsed = url.parse(route);
  route = parsed.pathname;
  var condensed = route.replace(/[^a-z_]/gi, '');

  return ((verb + condensed) in server.routes);
};
