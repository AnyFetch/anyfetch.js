'use strict';

var safeVerb = require('./safe-verb.js');

/**
 * Generate a filename from an endpoint descriptor.
 * Useful to enforce a naming convention.
 * @param {Object} config Endpoint descriptor
 * OR
 * @param {String} [verb] HTTP verb (defaults to GET)
 * @param {String} endpoint Endpoint
 *
 * @return {String} the corresponding filename
 */
module.exports = function endpointFilename(verb, endpoint) {
  if(!endpoint) {
    var config = verb;
    endpoint = config.endpoint;
    verb = config.verb || config.method || 'GET';
  }

  verb = safeVerb(verb);
  if(endpoint === '/') {
    endpoint += 'index';
  }
  endpoint = endpoint.replace(/[\/\.]/g, '-').replace(/[\{|\:\}]/g, '');

  return verb + endpoint;
};
