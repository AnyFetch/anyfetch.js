'use strict';
/**
 * @file Easy access to Cluestr API.
 *
 * @see http://cluestr.com
 */

var request = require('request');


// Url to retrieve an access_token
var ACCESSTOKEN_CREATION = '/oauth/token';
// Url to create a new document
var DOCUMENT_CREATION = '/providers/documents';
var DOCUMENT_FILE_CREATION = '/providers/documents/file';

/**
 * Cluestr Oauth libraries
 * Tools for easy communication with Cluestr API.
 *
 * @param {string} your appId your application id, generated via Cluestr
 * @param {string} appSecret your application secret, generated via Cluestr
 */
module.exports = function(appId, appSecret) {
  // Root URL for the API. Can be updated for testing, Virtual Appliance or running in LAN.
  this.API_ROOT = process.env.CLUESTR_SERVER || 'http://api.cluestr.com';
  this.API_FRONT = process.env.CLUESTR_FRONT || 'http://cluestr.com';

  this.ACCESSTOKEN_CREATION = ACCESSTOKEN_CREATION;
  this.DOCUMENT_CREATION = DOCUMENT_CREATION;
  this.DOCUMENT_FILE_CREATION = DOCUMENT_FILE_CREATION;

  this.ERR_NO_ACCESS_TOKEN = new Error("This method requires you to define an accessToken.");

  /*************
  * CLASS ATTRIBUTES
  */

  // Closure for this item
  var self = this;
  // Store accessToken for this session
  var accessToken = null;

  /**
   * Retrieve an access token from Cluestr
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
        return cb(new Error("Cluestr returned non-200 code: " + resp.statusCode + '. ' + JSON.stringify(resp.body)));
      }

      cb(null, JSON.parse(resp.body).access_token);
    });
  };

  /*
   * Define the access token to use for all authenticated requests to Cluestr API.
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
   * @param {Object} datas Datas parameter for `sendDocument`
   * @param {Object} fileConfig Config parameter for `sendFile`
   * @param {Function} cb Callback, error being first argument, then data about the new document.
   */
  this.sendDocumentAndFile = function(datas, fileConfig, cb) {
    self.sendDocument(datas, true, function(err, doc) {
      if(err) {
        return cb(err);
      }

      self.sendFile(datas.identifier, fileConfig, function(err) {
        cb(err, doc);
      });
    });
  };

  /**
   * Send a document to Cluestr
   *
   * @param {Object} datas to be sent to Cluestr, following the documentation for API_ROOT/providers/documents.
   * @param {bool} hasFile set to true if you intend to send a file with this document
   * @param {function} cb callback to be called once document has been created / updated. First parameter will be the error (if any), second will be the return from the API.
   *
   */
  this.sendDocument = function(datas, hasFile, cb) {
    if(!cb) {
      cb = hasFile;
      hasFile = false;
    }

    // We have a file pending, so let's skip hydration for now.
    if(hasFile) {
      datas.no_hydration = true;
    }

    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }

    if(!datas.identifier) {
      return cb(new Error('Document must include an identifier.'));
    }

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION,
      json: datas,
      headers: {
        'Authorization': 'token ' + self.accessToken
      }
    };

    request.post(params, function(err, resp) {
      if(err) {
        return cb(err);
      }
      if(resp.statusCode !== 200) {
        return cb(new Error('Cluestr returned non-200 code: ' + resp.statusCode + '. ' + JSON.stringify(resp.body)));
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

    var params = {
      url: self.API_ROOT + self.DOCUMENT_FILE_CREATION,
      headers: {
        'Authorization': 'token ' + self.accessToken
      }
    };

    var r = request.post(params, function(err, respFile) {
      if(err) {
        return cb(err);
      }

      if(respFile.statusCode !== 204) {
        return cb(new Error('Cluestr returned non-204 code: ' + respFile.statusCode + '. ' + JSON.stringify(respFile.body)));
      }

      cb(null);
    });

    var form = r.form();
    form.append('identifier', identifier);

    var fileDatas = config.file;
    delete config.file;
    form.append('file', fileDatas, config);

    r.on('error', function(err) {
      console.log("Network error when sending " + identifier);
      console.log(err.stack);
    });
  };

  /**
   * Remove a document from cluestr
   * 
   * @param {string} identifier document identifier to be deleted
   * @param {Function} cb Callback post-delete, first argument is the error if any.
   */
  this.deleteDocument = function(identifier, cb) {
    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION,
      form: {
        'identifier': identifier
      },
      headers: {
        'Authorization': 'token ' + self.accessToken
      }
    };

    request.del(params, function(err, resp) {
      if(err) {
        return cb(err);
      }

      if(resp.statusCode !== 204) {
        return cb(new Error('Cluestr returned non-204 code: ' + resp.statusCode + '. ' + JSON.stringify(resp.body)));
      }

      cb();
    });
  };
};
