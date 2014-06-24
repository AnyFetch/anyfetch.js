'use strict';

/**
 * @file High-level helper functions for common Fetch API use-cases.
 */

var async = require('async');
var qs = require('querystring');
var isMongoId = require('./helpers/is-mongo-id.js');

/**
 * Extend the prototype of Anyfetch with helper functions
 */
module.exports = function addHelpers(Anyfetch) {

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
  // TODO: same function by `identifier`
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

      function handleResults(res, cb) {
        var doc = res.body[documentUri];
        doc.provider = res.body['/providers'][doc.provider];
        doc.document_type = res.body['/document_types'][doc.document_type];

        cb(null, doc);
      }

    ], finalCb);
  };

  /**
   * Create a new document and associate it the given file.
   * @param {Object} document
   * @param {Buffer|ReadStream|String} file Filename or,
   *   for example, a stream opened with `fs.createReadStream`
   * @param {Function} cb(err, doc)
   */
  Anyfetch.prototype.sendDocumentAndFile = function(document, file, finalCb) {
    var self = this;
    async.waterfall([

      function createDocument(cb) {
        self.postDocument(document, cb);
      },

      function checkSuccess(res, cb) {
        if(!res.body || !res.body.id) {
          return cb(new Error('Error creating the document: ' + res.body));
        }
        cb(null, res.body);
      },

      function addFile(doc, cb) {
        self.getDocumentById(doc.id).postFile(file, function(err) {
          cb(err, doc);
        });
      },

    ], finalCb);
  };

  /**
   * Get the user's information (id, email, etc) from the currently used credentials.
   * @param {Function} cb(err, user)
   */
  Anyfetch.prototype.getCurrentUser = function(finalCb) {
    var calls = {
      '/': [],
      '/users': []
    };

    var self = this;
    async.waterfall([

      function makeBatchCall(cb) {
        self.batch(calls, cb);
      },

      function handleResults(res, cb) {
        var index = res.body['/'];
        var users = res.body['/users'];

        for(var i in users) {
          if(users[i].email === index.user_email) {
            return cb(null, users[i]);
          }
        }

        cb(new Error('NotFound: no user with email ' + index.user_email + ' was found'));
      }

    ], finalCb);
  };

  /**
   * Create a new user and move it to a new subcompany. The new user will be the first
   * admin of the subcompany.
   * @param {Object} subcompany Informations of the subcompany
   * @param {Object} newAdmin User info of the admin to create. The key `is_admin` must be set to true.
   * @param {Function} cb(err, subcompany)
   */
  Anyfetch.prototype.createSubcompanyWithAdmin = function(subcompany, newAdmin, finalCb) {
    if(!newAdmin.is_admin) {
      return finalCb(new Error('The given user must have `is_admin` set to true'));
    }

    var self = this;
    async.waterfall([

      // Create the admin user who will be named admin of the new subcompany
      function createAdmin(cb) {
        self.postUser(newAdmin, cb);
      },

      function checkSuccess(res, cb) {
        if(!res.body || !res.body.id || !res.body.is_admin) {
          return cb(new Error('Error creating the admin: ' + res.body));
        }
        cb();
      },

      function createSubcompany(cb) {
        var newAdminFetch = new Anyfetch(newAdmin.email, newAdmin.password);
        newAdminFetch.postSubcompany(subcompany, cb);
      },

      function extractSubcompany(res, cb) {
        cb(null, res.body);
      }

    ], finalCb);
  };

  return Anyfetch;
};