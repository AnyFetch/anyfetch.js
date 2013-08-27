'use strict';
/**
 * @file Easy access to Cluestr API.
 *
 * @see http://cluestr.com
 */

var request = require('request');

// Root URL for the API. Can be updated for testing or VA purposes
var API_ROOT = 'http://api.cluestr.com';
// Url to retrieve an access_token
var ACCESSTOKEN_CREATION = '/oauth/token';
// Url to create a new document
var DOCUMENT_CREATION = '/providers/documents';

/**
 * Cluestr Oauth libraries
 * Tools for easy communication with Cluestr API.
 *
 * @param {string} your appId your application id, generated via Cluestr
 * @param {string} appSecret your application secret, generated via Cluestr
 */
module.exports = function(appId, appSecret) {

  this.API_ROOT = API_ROOT;
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
   * Retrieve an access token from Cluestr
   * 
   * @param {string} code value to be traded for tokens
   * @param {function} cb callback to be called once token are retrieved, will take as params the error and the new access_token. Additionnally, the access_token will be automatically set on this instance.
   */
  this.getAccessToken = function(code, cb) {
    var params = {
      url: self.API_ROOT + self.ACCESSTOKEN_CREATION,
      form: {
        client_id: appId,
        client_secret: appSecret,
        code: code,
        grant_type: 'authorization_code',
      }
    };

    request.post(params, + code, function(err, resp) {
      if(err) {
        return cb(err);
      }
      if(resp.statusCode !== 200) {
        return cb(new Error("Cluestr returned non-200 code: " + resp.statusCode + '. ' + (resp.body && resp.body.error ? resp.body.error : '')));
      }

      cb(null, resp.body.access_token);
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
   * Send a document to cluestr
   *
   * @param {Object} datas to be sent to Cluestr, following the documentation for API_ROOT/providers/documents
   * @param {function} cb callback to be called once document has been created / updated. First parameter will be the error (if any), second will be the return from the API.
   *
   */
  this.sendDocument = function(datas, cb) {
    if(!self.accessToken) {
      return cb(self.ERR_NO_ACCESS_TOKEN);
    }

    if(!datas.identifier) {
      return cb(new Error("Document must include an identifier."));
    }

    var params = {
      url: self.API_ROOT + self.DOCUMENT_CREATION,
      form: datas,
      headers: {
        'Authorization': 'token ' + self.accessToken
      }
    };

    request.post(params, function(err, resp) {

      if(err) {
        return cb(err);
      }
      if(resp.statusCode !== 200) {
        return cb(new Error("Cluestr returned non-200 code: " + resp.statusCode + '. ' + (resp.body && resp.body.error ? resp.body.error : '')));
      }

      cb(null, resp.body);
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
      url: self.DOCUMENT_CREATION,
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
        return cb(new Error("Cluestr returned non-204 code: " + resp.statusCode + '. ' + (resp.body && resp.body.error ? resp.body.error : '')));
      }

      cb();
    });
  };
};
