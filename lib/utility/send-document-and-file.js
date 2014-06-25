'use strict';

var async = require('async');
var rarity = require('rarity');

/**
 * Create a new document and associate it the given file.
 * @param {Object} document
 * @param {Buffer|ReadStream|String} file Filename or,
 *   for example, a stream opened with `fs.createReadStream`
 * @param {Function} cb(err, doc)
 */
module.exports = function sendDocumentAndFile(document, file, finalCb) {
  var self = this;
  async.waterfall([
    function createDocument(cb) {
      self.postDocument(document, function(err, res) {
        cb(err, res.body);
      });
    },

    function addFile(doc, cb) {
      cb = rarity.carryAndSlice([doc], 2, cb);
      self.getDocumentById(doc.id).postFile(file, cb);
    },
  ], finalCb);
};