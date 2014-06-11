'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @TODO: wrap into an Anyfetch class
 * @TODO: split into smaller files and / or functions
 * @TODO: use prototype
 * @see http://anyFetch.com
 */

var request = require('supertest');

var configuration = require('../config/configuration.js');
var isFunction = require('./helpers/is-function.js');
var extendDefaults = require('./helpers/extend-defaults.js');


// TODO: Use the access token from the Anyfetch object instance
var accessToken = configuration.accessToken;

var anyfetchRequest = request(configuration.apiHost);

/**
 * Generate a simple API mapping function from an endpoint description
 * @param {Object} config Description of the endpoint
 * @see `config/json/api-descriptors.json` for examples
 */
var generateMapping = function(name, config) {
  // `config` extends the default descriptor
  extendDefaults(config, configuration.defaultDescriptor);

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
      if(isNaN(id)) {
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

/**
 * Add the nice semantic aliases described in `configuration.aliases`
 * E.g. postSubcompany --> postSubcompanies
 * (What it does is to post ONE company, so it makes more sense)
 * @param {Object} mappingFunctions The object in which to store the aliases
 */
var generateAliases = function(mappingFunctions) {
  for(var newName in configuration.aliases) {
    mappingFunctions[newName] = mappingFunctions[configuration.aliases[newName]];
  }

  return mappingFunctions;
};

/**
 * Allow more complex syntax for API calls that are related to an element.
 * Examples:
 * - `getDocumentById(123).getRelated(cb)`
 * - `getDocumentByIdentifier(123).postFile(file, cb)`
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
    // The subfunction's config extends the base config
    extendDefaults(thisConfig, baseConfig);

    // Trick: "hardcode" id parameter in endpoint and proceed as usual
    thisConfig.endpoint = baseConfig.endpoint + thisConfig.endpoint;

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
      if (baseConfig.requireId && isNaN(id)) {
        return cb(new Error('Argument error in ' + extendedEndpoint + ': the first argument must be a numeric id'));
      }

      return singleStepFunction(id, arguments[1]);
    }

    /**
     * Currying FTW
     */
    var subFunctions = {};

    Object.keys(subFunctionsConfig).forEach(function(name) {
      subFunctions[name] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(id);
        subFunctionsGenerator[name].apply(this, args);
      };
    }); // Done generating second-step functions

    return subFunctions;
  };
};

/**
 * Manually add the `postFile` function to `getDocumentById`
 */
var addPostFileFunctions = function(mappingFunctions) {

  /**
   * Add a file to a previously uploaded document
   *
   * @param {Object} Must at least contain a `file` key, which can either be a stream (e.g. `fs.createReadStream`) or a Buffer object. Can also contains a `contentType` key (for MIME type), and a `filename`.
   * @param {Function} cb Callback with error if any.
   * @Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
   */
  var makePostFileFunction = function(extendedEndpoint, id) {
    var idMustBeNumeric = configuration.apiDescriptors[extendedEndpoint].requireId;
    var baseEndpoint = configuration.apiDescriptors[extendedEndpoint].endpoint;

    return function postFile(config, cb) {
      if (idMustBeNumeric && isNaN(id)) {
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

      anyfetchRequest.post(endpoint)
        .set('Authorization', 'Bearer ' + accessToken)
        .attach('file', config.file, options)
        .expect(204)
        .end(cb);
    };
  };

  var addPostFileFunction = function(endpointToExtend) {
    var previousVersion = mappingFunctions[endpointToExtend];
    mappingFunctions[endpointToExtend] = function(id, cb) {
      var ret = previousVersion(id, cb);
      // Two-step call syntax
      // In this case, `ret` contains the various "extended" functions
      if (!isFunction(cb)) {
        // Manually add the postFile function
        ret.postFile = makePostFileFunction(endpointToExtend, id);
      }
      return ret;
    };
  };

  addPostFileFunction('getDocumentById');
  addPostFileFunction('getDocumentByIdentifier');

  return mappingFunctions;
};

/**
 * Generate the associated function for each endpoint
 * described in `configuration.apiDescriptors`.
 * If a key `subFunctions` is specified, advanced mappings (two-steps)
 * are added as well.
 */
var generateMappings = function() {
  var mappingFunctions = {};
  Object.keys(configuration.apiDescriptors).forEach(function(name) {
    var config = configuration.apiDescriptors[name];

    mappingFunctions[name] = generateMapping(name, config);

    if(config.subFunctions) {
      mappingFunctions[name] = generateSubFunctionMappings(name, config, mappingFunctions[name]);
    }
  });
  return mappingFunctions;
};

var mappings = generateMappings();
mappings = generateAliases(mappings);
mappings = addPostFileFunctions(mappings);

module.exports = mappings;
