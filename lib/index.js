'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @TODO: wrap into an Anyfetch class
 * @TODO: split into smaller files and / or functions
 * @see http://anyFetch.com
 */

var request = require('supertest');

var configuration = require('../config/configuration.js');

// TODO: Use the access token from the Anyfetch object instance
var accessToken = process.env.ACCESS_TOKEN;

var anyfetchRequest = request(configuration.apiHost);

/**
 * @return Whether `f` is a function
 */
var isFunction = function(f) {
  return !!(f && f.constructor && f.call && f.apply);
};

/**
 * Generate a simple API mapping function from an endpoint description
 * @param {Object} config Description of the endpoint
 * @see `config/json/api-descriptors.json` for examples
 */
var generateMapping = function(config, name) {
  // `config` extends the default descriptor
  for(var i in configuration.defaultDescriptor) {
    if(!config[i]) {
      config[i] = configuration.defaultDescriptor[i];
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
    // Convert arguments to an array
    var args = Array.prototype.slice.call(arguments);

    // We must support quite a lot of different call syntaxes
    var params = {};
    var body = {};

    // cb is always the last argument
    var cb = args.pop();
    // cb must be a function
    if (!isFunction(cb)) {
      throw new Error('Argument error in ' + name + ':' + ' the last argument must be a function (callback)');
    }

    if (config.body) {
      body = args.pop() || {};
      // Make sure that every field of the body is accepted
      for(var key in body) {
        if(config.body.indexOf(key) === -1) {
          return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s body'));
        }
      }
    }

    if (config.params) {
      params = args.pop() || {};
      // Make sure that every GET parameter is accepted
      for(var key in params) {
        if(config.params.indexOf(key) === -1) {
          return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s GET parameters'));
        }
      }
    }

    // id is always the first parameter (when it's actually required)
    // An `identifier` is not necessarily numeric
    if(config.requireId || config.requireIdentifier) {
      var id = args.pop();
      if(config.requireId && isNaN(id)) {
        return cb(new Error('Argument error in ' + name + ':' + ' the first parameter must be a numeric id'));
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

/**
 * Generate the associated function for each endpoint
 * described in `configuration.apiDescriptors`
 */
var generateSimpleMappings = function() {
  var mappingFunctions = {};
  for (var name in configuration.apiDescriptors) {
    mappingFunctions[name] = generateMapping(configuration.apiDescriptors[name], name);
  }
  return mappingFunctions;
};

/**
 * Add the nice semantic aliases described in `configuration.aliases`
 * E.g. postSubcompany --> postSubcompanies
 * (What it does is to post ONE company, so it makes more sense)
 * @param {Object} mappingFunctions The object in which to store the aliases
 */
var generateAliases = function(mappingFunctions) {
  for (var newName in configuration.aliases) {
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
var generateAdvancedMappings = function(mappingFunctions) {
  
  // For each extended endpoint
  Object.keys(configuration.documentRelatedEndpoints).forEach(function(extendedEndpoint) {

    var idMustBeNumeric = configuration.apiDescriptors[extendedEndpoint].requireId;
    var baseEndpoint = configuration.apiDescriptors[extendedEndpoint].endpoint;
    // Descriptors of the second-step calls available
    var configs = configuration.documentRelatedEndpoints[extendedEndpoint];

    /**
     * Support two call syntaxes:
     * - Single step: theEndpoint(123, cb)
     * - Two steps: theEndpoint(123).getRelated(cb)
     * Error handling is always done at the last step so as
     * to avoid throwing.
     */
    var singleStepFunction = mappingFunctions[extendedEndpoint];
    mappingFunctions[extendedEndpoint] = function(id, cb) {

      // Single-step call syntax
      if (isFunction(cb)) {
        if (idMustBeNumeric && isNaN(id)) {
          return cb(new Error('Argument error in ' + extendedEndpoint + ': the first argument must be a numeric id'));
        }

        return singleStepFunction(id, arguments[1]);
      }

      // Two-step call syntax
      var secondStep = {};
      // For each endpoint declared as a second step
      Object.keys(configs).forEach(function(name) {
        var config = configs[name];
        // We've already taken care of those
        config.requireIdentifier = false;
        config.requireId = false;
        // Trick: "hardcode" id parameter in endpoint and proceed as usual
        config.endpoint = baseEndpoint + config.endpoint;
        config.endpoint = config.endpoint.replace('{id}', id);

        /**
         * Wrapper function to allow us to handle errors
         * when an actual callback is passed to us.
         * We assume the last argument is the callback.
         */
        secondStep[name] = function(){
          if (idMustBeNumeric && isNaN(id)) {
            var cb = arguments[arguments.length - 1];
            return cb(new Error('Argument error in ' + extendedEndpoint + '.' + name + ': the first argument must be a numeric id'));
          }
          // Forward the call
          generateMapping(config, name).apply(this, arguments);
        };
      }); // Done generating second-step functions

      /**
       * Add a file to a previously uploaded document
       *
       * @param {Object} Must at least contain a `file` key, which can either be a stream (e.g. `fs.createReadStream`) or a Buffer object. Can also contains a `contentType` key (for MIME type), and a `filename`.
       * @param {Function} cb Callback with error if any.
       * @Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
       */
      secondStep.postFile = function(config, cb) {
        if (idMustBeNumeric && isNaN(id)) {
          return cb(new Error('Argument error in ' + extendedEndpoint + '.postFile: the first argument must be a numeric id'));
        }

        if(isFunction(config)) {
          config = config();
        }
        if (!config.file) {
          return cb(new Error('The config parameter must contain a `file` key'));
        }

        var endpoint = baseEndpoint.replace('{id}', id) + '/file';
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

      return secondStep;
    }; // Done extending this endpoint
  }); // Done going through extended endpoints

  return mappingFunctions;
};

var generateAllMappings = function() {
  var mappings = generateSimpleMappings();
  mappings = generateAliases(mappings);
  mappings = generateAdvancedMappings(mappings);
  return mappings;
};

module.exports = generateAllMappings();
