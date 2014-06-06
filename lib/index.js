'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */
var request = require('request')

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

}

var mappingDescriptor = {
  // TODO: / (retrieve all infos about the current account)
  'getCompany': {
    expectedStatus: 200,
    endpoint: '/company',
    verb: 'GET',
    params: ['id']
  },
  'getDocumentById': {
    expectedStatus: 200,
    endpoint: '/documents/{id}',
    verb: 'GET',
    params: ['id'] // Or generate params directly from `endpoint`?
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
        'Authorization': 'Bearer ' + accessToken
      }
      // TODO: make sure SSL is used
    };

    request(options, function(err, res, body) {
      if (res.statusCode != config.expectedStatus)
        return cb(new Error('Received code ' + res.statusCode + ', expected ' + config.expectedStatus));

      cb(err, body);
    });
  };
};

// Generate the function for each endpoint
for (var name in mappingDescriptor) {
  mappingFunctions[name] = generateMapping(mappingDescriptor[name]);

  // Test the generated function
  (function(name) {
    mappingFunctions[name]({}, function(err, result) {
      console.log("> Calling " + name);
      console.log(err);
      console.log(result);
    });
  }(name));
}