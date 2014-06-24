'use strict';

/**
 * @file High-level helper functions for common Fetch API use-cases.
 */

var async = require('async');
var qs = require('querystring');
var isMongoId = require('./helpers/is-mongo-id.js');

// We extend the prototype of Anyfetch with helper functions
// TODO: refactor to expose *all* functions directly from `index.js`
var Anyfetch = require('./index.js');

/**
 * Send the given GET calls as a single batch request.
 * @param {Object} calls An object mapping the endpoint to an array of params. The params can be `null`.
 *    Each object can specify the keys `endpoint` and an array of `params`
 * @param {Function} cb(err, results)
 *    {Object} results The result of each call, indexed by endpoint name
 */
Anyfetch.prototype.batch = function(calls, cb) {
  var pages = [];
  for(var endpoint in calls) {
    pages.push(endpoint + qs.encode(calls[endpoint]));
  }
  this.getBatch({pages: pages}, cb);
};

/**
 * Fetch the document, with keys `document_type` and `provider` populated
 * @param {String} The id of the document to get. Must be a valid MongoDB ObjectId
 * @param {Function} cb(err, document)
 */
Anyfetch.prototype.getDocumentWithInfo = function(id, finalCb) {
  if(!id || !isMongoId(id)) {
    return finalCb(new Error('Argument error: the first argument must be a valid MongoDB ObjectId'));
  }

  var documentUri = '/documents/' + id;
  var calls = {
    '/document_types': [],
    '/providers': []
  };
  calls[documentUri] = [];

  var self = this;
  async.waterfall([

    function makeBatchCall(cb) {
      self.batch(calls, cb);
    },

    function handleResults(body, cb) {
      var doc = body[documentUri];
      doc.provider = body['/providers'][doc.provider];
      doc.document_type = body['/document_types'][doc.document_type];

      cb(null, doc);
    }
    
  ], finalCb);
};

/**
 * Create a new document from the given file.
 * @param {Object} document
 * @param {Buffer|ReadStream|String} file Filename or,
 *   for example, a stream opened with `fs.createReadStream`
 * @param {Function} cb(err)
 */
Anyfetch.prototype.sendDocumentAndFile = function(document, file, cb) {
  // TODO
};

/**
 * Get the user's information (id, email, etc) from the currently used credentials.
 * @param {Function} cb(err, user)
 */
Anyfetch.prototype.getCurrentUser = function(cb) {
  // TODO
};

/**
 * Create a new user and move it to a new subcompany. The new user will be the first
 * admin of the subcompany.
 * @param {Object} subcompany Informations of the subcompany
 * @param {Object} newAdmin User info of the admin to create. The key `is_admin` must be set to true.
 * @param {Function} cb(err)
 */
Anyfetch.prototype.createSubcompanyWithAdmin = function(subcompany, newAdmin, cb) {
  // TODO
};

module.exports = Anyfetch;