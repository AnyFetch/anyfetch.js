'use strict';

var async = require('async');

/**
 * Fetch the document, with keys `document_type` and `provider` populated
 * @param {String} The identifier of the document to get
 * @param {Function} cb(err, document)
 */
module.exports = function getDocumentWithInfoByIdentifier(identifier, finalCb) {
  var documentUri = '/documents/identifier/' + identifier;
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