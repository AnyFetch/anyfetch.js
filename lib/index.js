'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */
var request = require('request')

// TODO: wrap into an Anyfetch class
// TODO: Anyfetch.getAccessToken(APP_ID, APP_SECRET, code, function(err, accessToken)

// TODO: make configurable
var apiUrl = 'http://api.anyfetch.com';

/**
 * Will be used to automatically generate the simplest mapping functions
 * @see api.anyfetch.com/config/routes.js
 */
var defaultDescriptor = {

}

var mappingDescriptor = {
  // TODO: / (retrieve all infos about the current account)
  'getToken': {
    expectedStatus: 200,
    endpoint: '/token',
    verb: 'GET',
    authType: 'Basic'
  },
  'deleteToken': {
    expectedStatus: 200,
    endpoint: '/token',
    verb: 'DELETE',
    authType: 'Basic'
  },
  'getCompanyById': {
    expectedStatus: 200,
    endpoint: '/token',
    verb: 'DELETE',
    authType: 'Basic',
    params: ['id']
  }
}
var mappingFunctions = {};

// var mappingFunctions = mappingDescriptor.map
var generateMapping = function(config) {
  return function(params, cb) {
    var options = {
      url: apiUrl + config.endpoint,
      method: config.verb,
      qs: config.params, // TODO: url encode
      headers: {
        // TODO: use the access token from the Anyfetch object instance
        'Authentication': 'Basic'
      }
      // TODO: make SSL is used
    };

    request(options, function(err, res, body) {
      if (res.statusCode != config.expectedStatus)
        return cb(new Error('Received code ' + res.statusCode + ', expected ' + config.expectedStatus));

      cb(err, res);
    });
  };
};

// Generate the function for each endpoint
for (var name in mappingDescriptor) {
  mappingFunctions[name] = generateMapping(mappingDescriptor[name]);

  // Test the generated function
  mappingFunctions[name]({}, function(err, result) {
    console.log("> Calling " + name);
    console.log(err);
    console.log(result);
  });
}