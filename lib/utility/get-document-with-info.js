'use strict';

var async = require('async');

var isMongoId = require('../helpers/is-mongo-id.js');

/**
 * Fetch the document, with keys `document_type` and `provider` populated
 * @param {String} The id of the document to get. Must be a valid MongoDB ObjectId
 * @param {Function} cb(err, document)
 */
// TODO: same function by `identifier`
module.exports = function getDocumentWithInfo(id, finalCb) {
  if(!id || !isMongoId(id)) {
    return finalCb(new Error('Argument error: the first argument must be a valid MongoDB ObjectId'));
  }

  var documentUri = '/documents/' + id;
  var pages = {
    '/document_types': {},
    '/providers': {}
  };
  pages[documentUri] = {};

  var self = this;
  async.waterfall([
    function makeBatchCall(cb) {
      self.batch(pages, cb);
    },

    function handleResults(res, cb) {
      var doc = res.body[documentUri];
      doc.provider = res.body['/providers'][doc.provider];
      doc.document_type = res.body['/document_types'][doc.document_type];

      cb(null, doc);
    }
  ], finalCb);
};