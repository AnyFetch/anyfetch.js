'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */

var request = require('supertest');


// Url to retrieve an access_token
var ACCESSTOKEN_CREATION = '/oauth/access_token';
// Url to create a new document
var DOCUMENT_CREATION = '/documents';

/**
 * encode parentheses in url
 */
var encodeURIComponentAndParentheses = function(string) {
  string = encodeURIComponent(string);
  string = string.replace(/\(/g, "%28");
  string = string.replace(/\)/g, "%29");
  return string;
};

/**
 * AnyFetch Oauth libraries
 * Tools for easy communication with AnyFetch API.
 *
 * @param {string} your appId your application id, generated via AnyFetch
 * @param {string} appSecret your application secret, generated via AnyFetch
 * @param {string} (opt) replacement URL for anyFetchServer
 * @param {string} (opt) replacement URL for anyFetchFront
 */
module.exports = function(appId, appSecret, anyFetchServer, anyFetchFront) {
  // Root URL for the API. Can be updated for testing, Virtual Appliance or running in LAN.
  this.API_FRONT = anyFetchFront || process.env.ANYFETCH_MANAGER_URL || 'http://manager.anyfetch.com';
  this.API_ROOT = anyFetchServer || process.env.ANYFETCH_API_URL || 'https://api.anyfetch.com';

  this.ACCESSTOKEN_CREATION = ACCESSTOKEN_CREATION;
  this.DOCUMENT_CREATION = DOCUMENT_CREATION;

  this.ERR_NO_ACCESS_TOKEN = new Error("This method requires you to define an accessToken.");

  /*************
  * CLASS ATTRIBUTES
  */

  // Closure for this item
  var self = this;
  // Store accessToken for this session

  var accessToken = null;
  /**
   * Retrieve an access token from AnyFetch
   *
   * @param {string} code value to be traded for tokens
   * @param {string} redirect_uri Your uri. totally useless, see https://github.com/applicake/doorkeeper/issues/280
   * @param {function} cb callback to be called once token are retrieved, will take as params the error and the new access_token. Additionnally, the access_token will be automatically set on this instance.
   */
  this.getAccessToken = function(code, redirect_uri, cb) {
    var form = {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirect_uri,
      code: code,
      grant_type: 'authorization_code',
    };

    request(self.API_FRONT)
      .post(self.ACCESSTOKEN_CREATION)
      .send(form)
      .expect(200)
      .end(function(err, resp) {
      if(err) {
        return cb(err);
      }

      cb(null, resp.body.access_token);
    });
  };

  /*
   * Define the access token to use for all authenticated requests to AnyFetch API.
   *
   * @param {String} _accessToken Access token to use for subsequent requests.
   */
  this.setAccessToken = function(_accessToken) {
    self.accessToken = _accessToken;
  };

  /**
   * Send a document, and upload a file to it.
   * Simple wrapper around `sendDocument` and `sendFile`
   * See their respective doc.
   *
   * @param {Object} data Data parameter for `sendDocument`
   * @param {Object} fileConfig Config parameter for `sendFile`
   * @param {Function} cb Callback, error being first argument, then data about the new document.
   */
  this.sendDocumentAndFile = function(data, fileConfig, cb) {
    self.sendDocument(data, function(err, doc) {
      if(err) {
        return cb(err);
      }

      self.sendFile(data.identifier, fileConfig, function(err) {
        cb(err, doc);
      });
    });
  };

  /**
   * Send a document to AnyFetch
   *
   * @param {Object} data to be sent to AnyFetch, following the documentation for API_ROOT/providers/documents.
   * @param {bool} hasFile set to true if you intend to send a file with this document
   * @param {function} cb callback to be called once document has been created / updated. First parameter will be the error (if any), second will be the return from the API.
   *
   */
  this.sendDocument = function(data, cb) {
    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }

    if(!data.identifier) {
      return cb(new Error('Document must include an identifier.'));
    }

    request(self.API_ROOT)
      .post(self.DOCUMENT_CREATION)
      .set('Authorization', 'Bearer ' + self.accessToken)
      .send(data)
      .expect(200)
      .end(function(err, resp) {
      if(err) {
        return cb(err);
      }

      cb(null, resp.body);
    });
  };

  /**
   * Send a file for a document already uploaded
   *
   * @param {String} identifier Identifier for the document
   * @param {Object} config Configuration object to add a file to the document. Must at least contain a `key` param, which can either be a stream (e.g. fs.createReadStream) or a Buffer object. Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters. The object can also contains a `contentType` key (for MIME type), and a `filename`.
   * @param {Function} cb Callback with error if any.
   */
  this.sendFile = function(identifier, config, cb) {
    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }


    if(typeof(config) === 'function') {
      config = config();
    }

    if(!config.file) {
      return cb(new Error("Config hash should include a file key"));
    }

    var fileData = config.file;
    delete config.file;

    request(self.API_ROOT)
      .post(self.DOCUMENT_CREATION + "/identifier/" + encodeURIComponentAndParentheses(identifier) + "/file")
      .set('Authorization', 'Bearer ' + self.accessToken)
      .attach('file', fileData, config)
      .expect(204)
      .end(cb);
  };

  /**
   * Remove a document from anyFetch
   *
   * @param {string} identifier document identifier to be deleted
   * @param {Function} cb Callback post-delete, first argument is the error if any.
   */
  this.deleteDocument = function(identifier, cb) {
    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }

    request(self.API_ROOT)
      .del(self.DOCUMENT_CREATION + "/identifier/" + encodeURIComponentAndParentheses(identifier))
      .set('Authorization', 'Bearer ' + self.accessToken)
      .expect(204)
      .end(cb);
  };
};

module.exports.debug = {
  createTestFrontServer: require('./test-servers/front.js'),
  createTestApiServer: require('./test-servers/api.js'),
  encodeURIComponentAndParentheses: encodeURIComponentAndParentheses,
};
