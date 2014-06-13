'use strict';

/**
 * Generate a filename from an endpoint descriptor.
 * Useful to enforce a naming convention.
 * @param {Object} config Endpoint descriptor
 * @param {String} the corresponding filename
 */
module.exports = function endpointFilename(config) {
  var verb = (config.verb === 'DELETE' ? 'del' : config.verb.toLowerCase());

  var endpoint = config.endpoint;
  if (endpoint === '/') {
    endpoint += 'index';
  }
  endpoint = endpoint.replace(/\//g, '-').replace(/\{|\}/g, '');

  return verb + endpoint;
};