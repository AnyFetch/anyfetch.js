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
  var apiServer = restify.createServer();
  apiServer.use(restify.acceptParser(apiServer.acceptable));
  apiServer.use(restify.queryParser());
  apiServer.use(restify.bodyParser());

  apiServer.post('/documents', function(req, res, next) {
    debug("POST /documents", req.params);

    if(!req.params.identifier) {
      return next(new restify.MissingParameterError("Specify identifier parameter."));
    }


    res.send(200, req.params);
    next();
  });

  apiServer.del('/documents', function(req, res, next) {
    if(!req.params.identifier) {
      return next(new restify.MissingParameterError("Specify identifier parameter."));
    }

    debug("DELETE /documents", req.params.identifier);

    res.send(204);
    next();
  });

  apiServer.post('/documents/file', function(req, res, next) {
    debug("POST /documents/file", req.params);

    if(!req.params.identifier) {
      return next(new restify.MissingParameterError("Specify identifier parameter."));
    }

    if(!req.files || !req.files.file) {
      return next(new restify.MissingParameterError("Expected a file."));
    }

    if(req.files.file.size === 0) {
      return next(new restify.MissingParameterError("File sent to /document/file is empty and contains no datas."));
    }

    res.send(204);
    next();
  });

  return apiServer;
};
