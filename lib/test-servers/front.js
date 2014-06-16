'use strict';

var restify = require('restify');

module.exports = function(debugMode) {
  var debug;
  if(debugMode === true) {
    debug = console.log;
  }
  if(!debugMode) {
    debug = function() {};
  }
  else {
    debug = debugMode;
  }

  // Create a fake HTTP server
  var frontServer = restify.createServer();
  frontServer.use(restify.acceptParser(frontServer.acceptable));
  frontServer.use(restify.queryParser());
  frontServer.use(restify.bodyParser());

  frontServer.post('/oauth/access_token', function(req, res, next) {
    debug("/oauth/access_token", req.params);

    if(!req.params.code) {
      return next(new restify.MissingParameterError("Specify code parameter"));
    }
    if(!req.params.client_id) {
      return next(new restify.MissingParameterError("Specify client_id parameter"));
    }
    if(!req.params.client_secret) {
      return next(new restify.MissingParameterError("Specify client_secret parameter"));
    }

    res.send({access_token: "fake_access_token"});
    next();
  });

  return frontServer;
};
