'use strict';

var async = require('async');
var qs = require('querystring');

/**
 * Fetch documents and populate their `document_type` and `provider` keys
 * @param {Object} [params] GET parameters to pass to `/documents` (e.g. search)
 * @param {Function} cb(err, document)
 */
module.exports = function getDocumentsWithInfo(params, finalCb) {
  if(!finalCb) {
    finalCb = params;
    params = {};
  }

  var pages = {
    '/documents': params,
    '/document_types': {},
    '/providers': {}
  };

  var self = this;
  async.waterfall([
    function makeBatchCall(cb) {
      self.batch(pages, cb);
    },

    function handleResults(res, cb) {
      var query = '';
      if(Object.keys(params).length > 0) {
        query = '?' + qs.stringify(params);
      }

      var docs = res.body['/documents' + query];
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
