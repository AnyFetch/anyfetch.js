'use stric';

/**
 * @file High-level helper functions for common Fetch API use-cases.
 */

/**
 * Fetch the document, with keys `document_type` and `provider` populated
 * @param {String} The id of the document to get. Must be a valid MongoDB ObjectId
 * @param {Function} cb(err, document)
 */
module.exports.getDocumentWithInfo = function(id, cb) {
  // TODO
};

/**
 * Create a new document from the given file.
 * @param {Object} document
 * @param {Buffer|ReadStream|String} file Filename or,
 *   for example, a stream opened with `fs.createReadStream`
 * @param {Function} cb(err)
 */
module.exports.sendDocumentAndFile = function(document, file, cb) {
  // TODO
};

/**
 * Get the user's information (id, email, etc) from the currently used credentials.
 * @param {Function} cb(err, user)
 */
module.exports.getCurrentUser = function(cb) {
  // TODO
};

/**
 * Create a new user and move it to a new subcompany. The new user will be the first
 * admin of the subcompany.
 * @param {Object} subcompany Informations of the subcompany
 * @param {Object} newAdmin User info of the admin to create. The key `is_admin` must be set to true.
 * @param {Function} cb(err)
 */
module.exports.createSubcompanyWithAdmin = function(subcompany, newAdmin, cb) {
  // TODO
};

/**
 * Send the given calls as a single batch request.
 * @param {Array<Object>} calls An array of objects describing the calls.
 *    Each object can specify the keys `endpoint`, `verb`, `params`,
 *    `body`, `identifier` as appropriate.
 * @param {Function} cb(err, results)
 *    {Object} results The result of each call, indexed by endpoint name
 */
module.exports.batch = function(calls, cb) {
  // TODO
};

