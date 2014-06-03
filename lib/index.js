'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */

var request = require('request');


// Url to retrieve an access_token
var ACCESSTOKEN_CREATION = '/oauth/token';
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
  this.API_FRONT = anyFetchFront || process.env.ANYFETCH_SETTINGS_URL || 'http://settings.anyfetch.com';
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
    var params = {
      url: self.API_FRONT + self.ACCESSTOKEN_CREATION,
      form: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirect_uri,
        code: code,
        grant_type: 'authorization_code',
      }
    };

    request.post(params, function(err, resp) {
      if(err) {
        return cb(err);
      }
      if(resp.statusCode !== 200) {
        return cb(new Error("AnyFetch returned non-200 code: " + resp.statusCode + '. ' + JSON.stringify(resp.body)));
      }

      cb(null, JSON.parse(resp.body).access_token);
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

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION,
      json: data,
      headers: {
        'Authorization': 'Bearer ' + self.accessToken
      }
    };

    request.post(params, function(err, resp) {
      if(err) {
        return cb(err);
      }
      if(resp.statusCode !== 200) {
        return cb(new Error('AnyFetch returned non-200 code: ' + resp.statusCode + '. ' + JSON.stringify(resp.body)));
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

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION + "/identifier/" + encodeURIComponentAndParentheses(identifier) + "/file",
      headers: {
        'Authorization': 'Bearer ' + self.accessToken
      }
    };

    var r = request.post(params, function(err, respFile) {
      if(err) {
        return cb(err);
      }

      if(respFile.statusCode !== 204) {
        return cb(new Error('AnyFetch returned non-204 code: ' + respFile.statusCode + '. ' + JSON.stringify(respFile.body)));
      }

      cb(null);
    });

    var form = r.form();

    var fileData = config.file;
    delete config.file;
    form.append('file', fileData, config);

    r.on('error', function(err) {
      console.log("Network error when sending " + identifier);
      console.log(err.stack);
    });
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

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION + "/identifier/" + encodeURIComponentAndParentheses(identifier),
      headers: {
        'Authorization': 'Bearer ' + self.accessToken
      }
    };

    request.del(params, function(err, resp) {
      if(err) {
        return cb(err);
      }

      if(resp.statusCode !== 204) {
        return cb(new Error('AnyFetch returned non-204 code: ' + resp.statusCode + '. ' + JSON.stringify(resp.body)));
      }

      cb();
    });
  };
};

module.exports.debug = {
  createTestFrontServer: require('./test-servers/front.js'),
  createTestApiServer: require('./test-servers/api.js'),
  encodeURIComponentAndParentheses: encodeURIComponentAndParentheses,
};
