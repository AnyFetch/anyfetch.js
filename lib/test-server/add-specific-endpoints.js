'use strict';

var restify;
try {
  restify = require('restify');
}
catch(e) {
  // No restify.
}

var hasCustomResponder = require('./helpers/has-custom-responder.js');
var getResponder = require('./helpers/get-responder.js');
var getContent = require('./helpers/get-content.js');

/**
 * These endpoints have a slightly more advanced behavior (param checking, etc).
 */
module.exports = function addSpecificEndpoints(server) {
  /**
   * Empty response to POST /documents/:id/file
   */
  server.post('/documents/:id/file', function(req, res, next) {
    if(hasCustomResponder('post', '/documents/:id/file')) {
      return getResponder('post', '/documents/:id/file')(req, res, next);
    }

    if(!req.files || !req.files.file) {
      res.send(new restify.MissingParameterError('Missing file in request'));
      return next();
    }

    res.send(204);
    next();
  });

  /**
   * Custom response to GET /batch
   * We craft the response from each asked endpoint.
   */
  server.get('/batch', function(req, res, next) {
    if(!req.params || !req.params.pages) {
      res.send(new restify.MissingParameterError('Missing `pages` parameter'));
      return next();
    }

    var pages = req.params.pages;
    var response = {};
    var status = 200;

    pages.forEach(function(page) {
      response[page] = getContent('get', page);

      if(!response[page]) {
        response.errored = page;
        response[page] = {
          code: 'NotFound',
          message: 'No mock for ' + page
        };
        status = 404;
      }
    });

    res.send(status, response);
    next();
  });
};
