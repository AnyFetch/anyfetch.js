'use strict';
/**
 * @file Low-level mapping functions to the FetchAPI
 * @see http://anyFetch.com
 */

var request = require('supertest');
var util = require('util');

var isFunction = require('./helpers/is-function.js');
var isMongoId = require('./helpers/is-mongo-id.js');

var configuration = require('../config/configuration.js');

module.exports = function addMappings(Anyfetch) {
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
     * apiMapping(id, [body], cb)    (optionnal middle parameter)
     * apiMapping(id, [params], cb)  (optionnal middle parameter)
     * apiMapping(params, cb)
     */
    return function apiMapping() {
      // Convert arguments to an array
      var args = Array.prototype.slice.call(arguments);

      // We must support quite a lot of different call syntaxes
      var endpoint = config.endpoint;
      var params = {};
      var body = {};
      var key;
      var isOmitted;

      // cb is always the last argument
      var cb = args.pop();
      // cb must be a function
      if(!isFunction(cb)) {
        throw new Error('Argument error in ' + name + ':' + ' the last argument must be a function (callback)');
      }

      if(config.body) {
        body = args.pop() || {};
        // `body` might be omitted
        isOmitted = util.isArray(body) || isFunction(body) || isMongoId(body);
        if(!isOmitted && !config.noCheckBody) {
          // Make sure that every field of the body is accepted
          for(key in body) {
            if(config.body.indexOf(key) === -1) {
              return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s body'));
            }
          }
        }
      }

      if(config.params) {
        params = args.pop() || {};
        // `params` might be omitted
        isOmitted = util.isArray(params) || isFunction(params) || isMongoId(params);
        if(!isOmitted && !config.noCheckParams) {
          // Make sure that every GET parameter is accepted
          for(key in params) {
            if(config.params.indexOf(key) === -1) {
              return cb(new Error('Argument error in ' + name + ':' + ' the key ' + key + ' is not allowed in this request\'s GET parameters'));
            }
          }
        }
      }

      // id is always the first parameter (when it's actually required)
      // An `identifier` is not necessarily numeric
      if(config.requireId) {
        var id = args.pop();
        // We allow `params` and / or `body` to be omitted
        id = id || params || body;

        if(!id || !isMongoId(id)) {
          return cb(new Error('Argument error in ' + name + ':' + ' the first parameter must be a valid MongoDB ObjectId'));
        }

        // Substitute id parameter in endpoint string
        endpoint = endpoint.replace('{id}', id);
      }

      if(config.requireIdentifier) {
        var identifier = encodeURI(args.pop());
        // Substitute id parameter in endpoint string
        endpoint = endpoint.replace('{identifier}', identifier);
      }

      // Build request (using supertest)
      var r = request(this.apiUrl)[config.method](endpoint)
        .query(params)
        .set('Authorization', this.authHeader);

      if(config.body) {
        r = r.send(body);
      }

      r.expect(config.expectedStatus)
       .end(cb);
    };
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
      if(isFunction(cb)) {
        if(baseConfig.requireId && (!id || !isMongoId(id))) {
          return cb(new Error('Argument error in ' + extendedEndpoint + ': the first argument must be a valid MongoDB ObjectId'));
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
       * @param {Function} cb(err, res) Callback with error if any.
       *
       * @warning: unfortunately, due to the variety of Stream, we can't type-check, so unexpected errors will occur if you specify weird file parameters.
       */
      return function postFile(config, cb) {
        if(idMustBeValid && (!id || !isMongoId(id))) {
          return cb(new Error('Argument error in ' + extendedEndpoint + '.postFile: the first argument must be a valid MongoDB ObjectId'));
        }

        if(isFunction(config)) {
          config = config();
        }
        if(!config.file) {
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

        request(this.apiUrl).post(endpoint)
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
        if(!isFunction(cb)) {
          // Manually add the postFile function
          var f = makePostFileFunction(endpointToExtend, id);
          ret.postFile = f.bind(this);
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


  generateMappings(configuration.apiDescriptors);
  addPostFileFunctions();
  generateAliases(configuration.aliases);

  return Anyfetch;
};
