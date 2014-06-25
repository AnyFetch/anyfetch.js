'use strict';

var async = require('async');

/**
 * Fetch documents and populate their `document_type` and `provider` keys
 * @param {Function} cb(err, document)
 */
module.exports = function getDocumentWithInfo(finalCb) {
  var pages = {
    '/documents': {},
    '/document_types': {},
    '/providers': {}
  };

  var self = this;
  async.waterfall([
    function makeBatchCall(cb) {
      self.batch(pages, cb);
    },

    function handleResults(res, cb) {
      var docs = res.body['/documents'];
      var providers = res.body['/providers'];
      var documentTypes = res.body['/document_types'];

      docs.data.forEach(function(doc) {
        doc.provider = providers[doc.provider];
        doc.document_type = documentTypes[doc.document_type];
      });

      cb(null, docs);
    }
  ], finalCb);
};