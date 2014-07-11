'use strict';

var restify = require('restify');

var getContent = require('././get-content.js');

/**
 * These endpoints are part of manager.anyfetch.com,
 * we mock them here for convenience only.
 */
module.exports = function addManagerEndpoints(server) {
  /**
  * OAuth token exchange endpoint
  */
  server.post('/oauth/access_token', function(req, res, next) {
   var expectedKeys = ['client_id', 'client_secret', 'code', 'grant_type'];
   expectedKeys.forEach(function(key) {
     if(!req.params[key]) {
       return next(new restify.InvalidArgumentError('Parameter `' + key + '` is missing'));
     }
   });

   if(req.params.grant_type !== 'authorization_code') {
     return next(new restify.InvalidArgumentError('Unsupported grant_type ' + req.params.grant_type + ', expected "authorization_code"'));
   }

   var json = getContent('post', '/oauth/access_token');
   res.send(200, json);
   next();
  });
};
