'use strict';

var async = require('async');
var qs = require('querystring');

/**
 * Fetch the document, with keys `document_type` and `provider` populated
 * @param {String} The identifier of the document to get
 * @param {Object} [params] GET parameters to pass to `/documents` (e.g. search)
 * @param {Function} cb(err, document)
 */
module.exports = function getDocumentWithInfoByIdentifier(identifier, params, finalCb) {
  if(!finalCb) {
    finalCb = params;
    params = {};
  }

  var documentUri = '/documents/identifier/' + identifier;
  var pages = {
    '/document_types': {},
    '/providers': {}
  };
  pages[documentUri] = params;

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

      var doc = res.body[documentUri + query];
      doc.provider = res.body['/providers'][doc.provider];
      doc.document_type = res.body['/document_types'][doc.document_type];

      cb(null, doc);
    }
  ], finalCb);
};
