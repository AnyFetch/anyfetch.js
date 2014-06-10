'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */
var request = require('supertest');
var async = require('async');
var fs = require('fs');

// TODO: wrap into an Anyfetch class
// TODO: Anyfetch.getAccessToken(APP_ID, APP_SECRET, code, function(err, accessToken)
// Use the access token from the Anyfetch object instance
var accessToken = process.env.ACCESS_TOKEN;

// TODO: make configurable
var apiHost = 'https://api.anyfetch.com';
var anyfetchRequest = request(apiHost);

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
};
// We'll read mapping descriptors from a JSON file
var apiDescriptorsFile = __dirname + '/apiDescriptors.json';
var aliasesFile = __dirname + '/aliases.json';

var generateMapping = function(config, name) {
  // `config` extends the default descriptor
  for(var i in defaultDescriptor) {
    if(!config[i]) {
      config[i] = defaultDescriptor[i];
    }
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
    var argErrorMessage = 'Argument error in ' + name + ':';

    // Convert arguments to an array
    var args = [];
    for (var i in arguments) {
      args.push(arguments[i]);
    }

    // We must support quite a lot of different call syntaxes
    var params = {};
    var body = {};

    // cb is always the last argument
    var cb = args.pop();
    // cb must be a function
    if (!(cb && cb.constructor && cb.call && cb.apply)) {
      return cb(new Error(argErrorMessage + ' the last argument must be a function (callback)'));
    }

    if (config.body) {
      body = args.pop() || {};
      // Make sure that every field of the body is accepted
      for(var key in body) {
        if(config.body.indexOf(key) === -1) {
          return cb(new Error(argErrorMessage + ' the key ' + key + ' is not allowed in this request\'s body'));
        }
      }
    }

    if (config.params) {
      params = args.pop() || {};
      // Make sure that every GET parameter is accepted
      for(var key in params) {
        if(config.params.indexOf(key) === -1) {
          return cb(new Error(argErrorMessage + ' the key ' + key + ' is not allowed in this request\'s GET parameters'));
        }
      }
    }

    // id is always the first parameter (when it's actually required)
    if(config.requireId) {
      var id = args.pop();
      if(isNaN(id)) {
        return cb(new Error('Argument error, the first parameter must be a numeric id'));
      }

      // Substitute id parameter in endpoint string
      config.endpoint = config.endpoint.replace('{id}', id);
    }

    var options = {
      uri: config.endpoint,
      // Need to convert the verb to superagent method name
      method: (config.verb === 'DELETE') ? 'del' : config.verb.toLowerCase(),
      qs: params,
      body: body
    };

    // Build request (using supertest)
    var r = anyfetchRequest[options.method](options.uri)
      .query(options.qs)
      .set('Authorization', 'Bearer ' + accessToken);

    if (config.body) {
      r = r.send(options.body);
    }

    r.expect(config.expectedStatus)
     .end(cb);
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
      mappingFunctions[name] = generateMapping(mappingDescriptor[name], name);
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
  // TODO: same thing with getDocumentByIdentifier
  function generateAdvancedMappings(mappingFunctions, cb) {
    // ----- Documents
    var getDocumentByIdCb = mappingFunctions.getDocumentById;
    mappingFunctions.getDocumentById = function() {
      // Invalid call syntax
      if (arguments.length > 2 || isNaN(arguments[0])) {
        // We assume the last argument is a callback
        arguments[arguments.length - 1](new Error('Invalid call syntax'));
      }
      var id = arguments[0];

      // Single-step call syntax
      // getDocumentById(123, cb)
      if (arguments.length === 2) {
        return getDocumentByIdCb(id, arguments[1]);
      }

      // Two-step call syntax
      // getDocumentById(123).getRelated(cb)
      return {
        // TODO: do not hardcode these endpoints
        getSimilar: generateMapping({ endpoint: '/documents/'+ id +'/similar' }, 'getSimilar'),
        getRelated: generateMapping({ endpoint: '/documents/'+ id +'/related' }, 'getRelated'),
        getRaw: generateMapping({ endpoint: '/documents/'+ id +'/raw' }, 'getRaw'),
        getFile: generateMapping({ endpoint: '/documents/'+ id +'/file' }, 'getFile'),
        /**
         * Add a file to a previously uploaded document
         *
         * @param {Object} Must at least contain a `file` key, which can either be a stream (e.g. `fs.createReadStream`) or a Buffer object. Can also contains a `contentType` key (for MIME type), and a `filename`.
         * @param {Function} cb Callback with error if any.
         * @Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
         */
        postFile: function(config, cb) {
          if(typeof(config) === 'function') {
            config = config();
          }
          if (!config.file) {
            return cb(new Error('The config parameter must contain a `file` key'));
          }

          var endpoint = '/documents/' + id + '/file';
          var options = {
            filename: config.filename || '',
            contentType: config.contentType || ''
          };

          anyfetchRequest.post(endpoint)
            .set('Authorization', 'Bearer ' + accessToken)
            .attach('file', config.file, options)
            .expect(204)
            .end(cb);
        }
      };
    };

    cb(null, mappingFunctions);
  }
  ],
  function(err, allMappings) {
    if (err) {
      // TODO: bubble up
      console.log(err);
      return;
    }

    // Test
    for (var name in allMappings) {
      console.log(name);
    }

    allMappings.getUsers(function(err, res) {
      console.log("> Called getUsers");
      console.log(err);
      console.log(res.body);
    });

    // var stream = fs.createReadStream(aliasesFile);
    // var fileConfig = {
    //   file: stream,
    //   contentType: 'application/json',
    //   filename: 'aliases.json'
    // };
    //
    // allMappings.getDocumentById(123).postFile(fileConfig, function(err, res) {
    //   console.log("> Called (123).postFile(file, cb)");
    //   console.log(err);
    //   console.log(res.body);
    // });
  }
);