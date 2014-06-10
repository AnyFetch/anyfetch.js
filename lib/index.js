'use strict';
/**
 * @file Easy access to AnyFetch API.
 * @TODO: wrap into an Anyfetch class
 * @see http://anyFetch.com
 */

var request = require('supertest');

var configuration = require('../config/configuration.js');

// TODO: Use the access token from the Anyfetch object instance
var accessToken = process.env.ACCESS_TOKEN;

var anyfetchRequest = request(configuration.apiHost);

/**
 * Determine if `f` is a function
 */
var isFunction = function(f) {
  return !!(f && f.constructor && f.call && f.apply);
};

/**
 * Will be used to automatically generate the simplest mapping functions
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
    if(config.requireId) {
      var id = args.pop();
      if(isNaN(id)) {
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

var generateSimpleMappings = function() {
  // Generate the function for each endpoint
  var mappingFunctions = {};
  for (var name in configuration.apiDescriptors) {
    mappingFunctions[name] = generateMapping(configuration.apiDescriptors[name], name);
  }
  return mappingFunctions;
};

/**
 * Add nice semantic aliases
 * E.g. postSubcompany --> postSubcompanies
 * (What is actually done is to post ONE company, so it makes more sense)
 */
var generateAliases = function(mappingFunctions) {
  for (var newName in configuration.aliases) {
    mappingFunctions[newName] = mappingFunctions[configuration.aliases[newName]];
  }
  return mappingFunctions;
};

/**
 * More complex syntax for API calls that are related to an element.
 * Examples:
 * - getDocumentById(123).getRelated(cb)
 * - getDocumentById(123).postFile(file, cb)
 * @warning getDocumentById(123, cb) is valid as well!
 */
// TODO: same thing with getDocumentByIdentifier
var generateAdvancedMappings = function(mappingFunctions) {
  // ----- Documents
  var getDocumentByIdCb = mappingFunctions.getDocumentById;

  /**
   * Support two call syntaxes:
   * - Single step: getDocumentById(123, cb)
   * - Two steps: getDocumentById(123).getRelated(cb)
   */
  mappingFunctions.getDocumentById = function(id, cb) {

    // Single-step call syntax
    if (isFunction(cb)) {
      if (isNaN(id)) {
        return cb(new Error('Argument error in getDocumentById: the first argument must be a numeric id'));
      }
      return getDocumentByIdCb(id, arguments[1]);
    }

    // Two-step call syntax
    var secondStep = {};
    for (var name in configuration.documentRelatedEndpoints) {
      var opt = configuration.documentRelatedEndpoints[name];
      // Trick: "hardcode" id parameter in endpoint and proceed as usual
      opt.endpoint = opt.endpoint.replace('{id}', id);

      secondStep[name] = function(){
        if (isNaN(id)) {
          // We assume the last parameter is a callback
          var cb = arguments[arguments.length - 1];
          return cb(new Error('Argument error in getDocumentById: the first argument must be a numeric id'));
        }

        generateMapping(opt, name).apply(this, arguments);
      };
    }

    /**
     * Add a file to a previously uploaded document
     *
     * @param {Object} Must at least contain a `file` key, which can either be a stream (e.g. `fs.createReadStream`) or a Buffer object. Can also contains a `contentType` key (for MIME type), and a `filename`.
     * @param {Function} cb Callback with error if any.
     * @Warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
     */
    secondStep.postFile = function(config, cb) {
      if (isNaN(id)) {
        return cb(new Error('Argument error in getDocumentById: the first argument must be a numeric id'));
      }

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
    };
    
    return secondStep;
  };

  return mappingFunctions;
};

var generateAllMappings = function() {
  var mappings = generateSimpleMappings();
  mappings = generateAliases(mappings);
  mappings = generateAdvancedMappings(mappings);
  return mappings;
};

module.exports = generateAllMappings();
