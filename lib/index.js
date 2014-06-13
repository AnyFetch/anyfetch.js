'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @TODO: wrap into an Anyfetch class (use prototype)
 * @TODO: split into smaller files and / or functions
 * @TODO: allow all parameters when starting with `_` (e.g. `_meta`)
 * @see http://anyFetch.com
 */

var request = require('supertest');

var isFunction = require('./helpers/is-function.js');
var isMongoId = require('./helpers/is-mongo-id.js');

var configuration = require('../config/configuration.js');

/**
 * Supported syntaxes:
 * - `new Anyfetch(accessToken)` (token authentication)
 * - `new Anyfetch(login, password)` (basic authentication)
 */
var Anyfetch = function(accessToken, password) {
  if(password) {
    // This is actually username:password
    var payload = new Buffer(accessToken + ':' + password);
    this.authHeader = 'Basic ' + payload.toString('base64');
  }
  else {
    this.authHeader = 'Bearer ' + accessToken;
  }

  this.apiHost = configuration.apiHost;
};

Anyfetch.prototype.setApiHost = function(host) {
  this.apiHost = host;
};

/**
 * Generate a simple API mapping function from an endpoint description
 * @param {String} name to give to the function
 * @param {Object} config Description of the endpoint
 * @see `config/json/api-descriptors.json` for examples
 */
var generateMapping = function(name, config) {
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
    var args = Array.prototype.slice.call(arguments);

    // We must support quite a lot of different call syntaxes
    var params = {};
    var body = {};
    var key;

    // cb is always the last argument
    var cb = args.pop();
    // cb must be a function
    if (!isFunction(cb)) {
      throw new Error('Argument error in ' + name + ':' + ' the last argument must be a function (callback)');
    }

    if (config.body) {
      body = args.pop() || {};
      // Make sure that every field of the body is accepted
      for(key in body) {
        if(config.body.indexOf(key) === -1) {
          return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s body'));
        }
      }
    }

    if (config.params) {
      params = args.pop() || {};
      // Make sure that every GET parameter is accepted
      for(key in params) {
        if(config.params.indexOf(key) === -1) {
          return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s GET parameters'));
        }
      }
    }

    // id is always the first parameter (when it's actually required)
    // An `identifier` is not necessarily numeric
    if(config.requireId) {
      var id = args.pop();
      if(!id || !isMongoId(id)) {
        return cb(new Error('Argument error in ' + name + ':' + ' the first parameter must be a numeric id'));
      }

      // Substitute id parameter in endpoint string
      config.endpoint = config.endpoint.replace('{id}', id);
    }

    if(config.requireIdentifier) {
      var identifier = encodeURI(args.pop());
      // Substitute id parameter in endpoint string
      config.endpoint = config.endpoint.replace('{identifier}', identifier);
    }

    // Build request (using supertest)
    var r = request(this.apiHost)[config.method](config.endpoint)
      .query(params)
      .set('Authorization', this.authHeader);

    if (config.body) {
      r = r.send(body);
    }

    r.expect(config.expectedStatus)
     .end(cb);
  };
};

/**
 * Add the nice semantic aliases described in `configuration.aliases`
 * E.g. postSubcompany --> postSubcompanies
 * (What it does is to post ONE company, so it makes more sense)
 * @param {Object} aliases The object which associates new name to old name
 */
var generateAliases = function(aliases) {
  for(var newName in aliases) {
    Anyfetch.prototype[newName] = Anyfetch.prototype[aliases[newName]];
  }
};

/**
 * Allow more complex syntax for API calls that are related to an element.
 * Examples:
 * - `getDocumentById(123).getRelated(cb)`
 * - `getDocumentByIdentifier(123).postFile(file, cb)`
 *
 * @param {String} extendedEndpoint The name of the function to extend
 * @param {Object} baseConfig Descriptor of the endpoint being extended
 * @param {Function} singleStepFunction Initial (single-step) version of the function
 * @warning getDocumentById(123, cb) remains valid as well!
 */
var generateSubFunctionMappings = function(extendedEndpoint, baseConfig, singleStepFunction) {
  // Descriptors of the second-step calls available
  var subFunctionsConfig = baseConfig.subFunctions;

  // Two-step call syntax
  var subFunctionsGenerator = {};
  // For each endpoint declared as a second step
  Object.keys(subFunctionsConfig).forEach(function(name) {
    // Local copy
    var thisConfig = {};
    for (var i in subFunctionsConfig[name]) {
      thisConfig[i] = subFunctionsConfig[name][i];
    }

    subFunctionsGenerator[name] = generateMapping(name, thisConfig);
  });


  /**
   * Support two call syntaxes:
   * - Single step: theEndpoint(123, cb)
   * - Two steps: theEndpoint(123).getRelated(cb)
   * Error handling is always done at the last step so as
   * to avoid throwing.
   */
  return function(id, cb) {
    // Single-step call syntax
    if (isFunction(cb)) {
      if (baseConfig.requireId && (!id || !isMongoId(id))) {
        return cb(new Error('Argument error in ' + extendedEndpoint + ': the first argument must be a numeric id'));
      }

      return singleStepFunction.call(this, id, arguments[1]);
    }

    /**
     * Currying FTW
     */
    var subFunctions = {};
    var self = this;
    Object.keys(subFunctionsConfig).forEach(function(name) {
      subFunctions[name] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(id);
        subFunctionsGenerator[name].apply(self, args);
      };
    });

    return subFunctions;
  };
};

/**
 * Manually add the `postFile` function to `getDocumentById`
 * in Anyfetch's prototype
 */
var addPostFileFunctions = function() {

  var makePostFileFunction = function(extendedEndpoint, id) {
    var idMustBeValid = configuration.apiDescriptors[extendedEndpoint].requireId;
    var baseEndpoint = configuration.apiDescriptors[extendedEndpoint].endpoint;

    /**
     * Add a file to a previously uploaded document
     *
     * @param {Object} Must at least contain a `file` key, which can either be a stream (e.g. `fs.createReadStream`) or a Buffer object. Can also contains a `contentType` key (for MIME type), and a `filename`.
     * @param {Function} cb Callback with error if any.
     * @Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
     */
    return function postFile(config, cb) {
      if (idMustBeValid && (!id || !isMongoId(id))) {
        return cb(new Error('Argument error in ' + extendedEndpoint + '.postFile: the first argument must be a numeric id'));
      }

      if(isFunction(config)) {
        config = config();
      }
      if (!config.file) {
        return cb(new Error('The config parameter must contain a `file` key'));
      }

      var endpoint;
      if(configuration.apiDescriptors[extendedEndpoint].requireId) {
        endpoint = baseEndpoint.replace('{id}', id) + '/file';
      }
      if(configuration.apiDescriptors[extendedEndpoint].requireIdentifier) {
        endpoint = baseEndpoint.replace('{identifier}', id) + '/file';
      }

      var options = {
        filename: config.filename || '',
        contentType: config.contentType || ''
      };

      request(this.apiHost).post(endpoint)
        .set('Authorization', this.authHeader)
        .attach('file', config.file, options)
        .expect(204)
        .end(cb);
    };
  };

  var addPostFileFunction = function(endpointToExtend) {
    var previousVersion = Anyfetch.prototype[endpointToExtend];
    Anyfetch.prototype[endpointToExtend] = function(id, cb) {
      var ret = previousVersion.call(this, id, cb);
      // Two-step call syntax
      // In this case, `ret` contains the various "extended" functions
      if (!isFunction(cb)) {
        // Manually add the postFile function
        ret.postFile = makePostFileFunction(endpointToExtend, id);
      }
      return ret;
    };
  };

  addPostFileFunction('getDocumentsById');
  addPostFileFunction('getDocumentsByIdentifier');
};

/**
 * Generate the associated function for each endpoint
 * described in `configuration.apiDescriptors`.
 * If a key `subFunctions` is specified, advanced mappings (two-steps)
 * are added as well.
 */
var generateMappings = function(descriptors) {
  Object.keys(descriptors).forEach(function(name) {
    var config = descriptors[name];

    Anyfetch.prototype[name] = generateMapping(name, config);

    if(config.subFunctions) {
      Anyfetch.prototype[name] = generateSubFunctionMappings(name, config, Anyfetch.prototype[name]);
    }
  });
};

generateMappings(configuration.apiDescriptors);
addPostFileFunctions();
generateAliases(configuration.aliases);

module.exports = Anyfetch;