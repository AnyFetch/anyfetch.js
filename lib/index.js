'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */
 // TODO: migrate to supertest
var request = require('request');
var async = require('async');
var util = require('util');
var fs = require('fs');

// TODO: wrap into an Anyfetch class
// TODO: Anyfetch.getAccessToken(APP_ID, APP_SECRET, code, function(err, accessToken)
// Use the access token from the Anyfetch object instance
var accessToken = process.env.ACCESS_TOKEN;

// TODO: make configurable
var apiUrl = 'https://api.anyfetch.com';

/**
 * Will be used to automatically generate the simplest mapping functions
 * @see api.anyfetch.com/config/routes.js
 */
var defaultDescriptor = {
  expectedStatus: 200,
  verb: 'GET',
  requireId: false,
  params: null,
  body: null
}
// We'll read mapping descriptors from a JSON file
var apiDescriptorsFile = __dirname + '/apiDescriptors.json';
var aliasesFile = __dirname + '/aliases.json';

var generateMapping = function(config) {
  // `config` extends the default descriptor
  for(var i in defaultDescriptor) {
    if(!config[i])
      config[i] = defaultDescriptor[i];
  }

  /**
   * Example of accepted call syntaxes:
   * (depending on the requirements of the API endpoint)
   * apiMapping(cb)
   * apiMapping(id, cb)
   * apiMapping(body, cb)
   * apiMapping(id, body, cb)
   * apiMapping(id, params, cb)
   * apiMapping(params, cb)
   */
  return function apiMapping() {
    // Convert arguments to an array
    var args = [];
    for (var i in arguments)
      args.push(arguments[i]);

    // We must support quite a lot of different call syntaxes
    var params = {};
    var body = {};

    // cb is always the last parameter
    var cb = args.pop();

    if (config.body) {
      body = args.pop() || {};
      // Make sure that every field of the body is accepted
      for(var key in body) {
        if(config.body.indexOf(key) < 0) {
          return cb(new Error('Argument error, the key ' + key + ' is not allowed in this request\'s body'));
        }
      }
    }

    if (config.params) {
      params = args.pop() || {};
      // Make sure that every GET parameter is accepted
      for(var key in params) {
        if(config.params.indexOf(key) === -1) {
          return cb(new Error('Argument error, the key ' + key + ' is not allowed in this request\'s GET parameters'));
        }
      }
    }

    // id is always the first parameter (when it's actually required)
    if(config.requireId) {
      var id = args.pop();
      if(!isNaN(id)) {
        // Substitute id parameter in endpoint string
        config.endpoint = config.endpoint.replace('{id}', id);
      }
      else {
        return cb(new Error('Argument error, the first parameter must be a numeric id'));
      }
    }

    var options = {
      // TODO: make sure SSL is used
      url: apiUrl + config.endpoint,
      method: config.verb,
      qs: params, // TODO: url encode
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify(body)
    };

    request(options, function(err, res, body) {
      if(res.statusCode != config.expectedStatus) {
        return cb(new Error('Received code ' + res.statusCode + ', expected ' + config.expectedStatus));
      }

      cb(err, body);
    });
  };
};

async.waterfall([
  function readJsonDescriptors(cb) {
    fs.readFile(apiDescriptorsFile, 'utf8', cb);
  },
  function processJson(data, cb) {
    var mappingDescriptor = JSON.parse(data);

    // Generate the function for each endpoint
    var mappingFunctions = {};
    for (var name in mappingDescriptor) {
      mappingFunctions[name] = generateMapping(mappingDescriptor[name]);
    }

    cb(null, mappingFunctions);
  },
  function readJsonAliases(mappingFunctions, cb) {
    fs.readFile(aliasesFile, 'utf8', function(err, data) {
      cb(err, data, mappingFunctions);
    });
  },
  /**
   * Add nice semantic aliases
   * E.g. postSubcompany --> postSubcompanies
   * (What is actually done is to post ONE company, so it makes more sense)
   */
  function generateAliases(data, mappingFunctions, cb) {
    var aliasesJson = JSON.parse(data);
    for (var newName in aliasesJson) {
      mappingFunctions[newName] = mappingFunctions[aliasesJson[newName]];
    }

    cb(null, mappingFunctions);
  },
  /**
   * More complex syntax for API calls that are related to an element.
   * Examples:
   * - getDocumentById(123).getRelated(cb)
   * - getDocumentById(123).postFile(file, cb)
   * @warning getDocumentById(123, cb) is valid as well!
   */
  function generateAdvancedMappings(mappingFunctions, cb) {
    // ----- Documents
    var getDocumentByIdCb = mappingFunctions['getDocumentById'];
    mappingFunctions['getDocumentById'] = function() {
      // Invalid call syntax
      if (arguments.length > 2 || isNaN(arguments[0])) {
        // We assume the last argument is a callback
        arguments[arguments.length - 1](new Error('Invalid call syntax'));
      }
      var id = arguments[0];

      // Single-step call syntax
      // getDocumentById(123, cb)
      if (arguments.length == 2) {
        return getDocumentByIdCb(id, arguments[1]);
      }

      // Two-step call syntax
      // getDocumentById(123).getRelated(cb)
      return {
        getSimilar: generateMapping({ endpoint: '/documents/'+ id +'/similar' }),
        getRelated: generateMapping({ endpoint: '/documents/'+ id +'/related' }),
        getRaw: generateMapping({ endpoint: '/documents/'+ id +'/raw' }),
        getFile: generateMapping({ endpoint: '/documents/'+ id +'/file' }),
        postFile: function(file, cb) {
          // TODO
        }
      }
    }

    cb(null, mappingFunctions);
  }
  ],
  function(err, allMappings) {
    if (err) {
      // TODO: bubble up
      console.log(err);
      return;
    }

    // TODO: output
  }
);

// TODO: more complex syntax: getDocumentById(123).getRelated(cb);