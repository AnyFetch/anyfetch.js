'use strict';

var qs = require('querystring');

/**
 * Send the given GET calls as a single batch request.
 * @param {Object} calls An object mapping the endpoint to params. The params can be `null`.
 *    Each object can specify the keys `endpoint` and an object of `params`
 * @param {Function} cb(err, results)
 *    {Object} results The result of each call, indexed by endpoint name
 */
module.exports = function batch(calls, cb) {
  var pages = [];
  for(var endpoint in calls) {
    var params = qs.encode(calls[endpoint]);
    var page = endpoint;
    if(params) {
      page += '?' + params;
    }
    pages.push(page);
  }
  this.getBatch({pages: pages}, cb);
};
