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
  expectedStatus: 200,
  verb: 'GET'
}

var mappingDescriptor = {
  'getStatus': {
    endpoint: '/status'
  },
  // ----- Index
  'getIndex': {
    endpoint: '/'
  },
  // ----- Company
  'getCompany': {
    endpoint: '/company'
  },
  'postCompanyUpdate': {
    endpoint: '/company/update',
    verb: 'POST',
    expectedStatus: 202
  },
  'deleteCompanyReset': {
    endpoint: '/company/reset',
    verb: 'DELETE',
    expectedStatus: 204
  },
  // ----- Subcompanies
  'getSubcompanies': {
    endpoint: '/subcompanies'
  },
  'postSubcompany': {
    endpoint: '/subcompanies',
    verb: 'POST',
    body: ['name', 'hydraters']
  },
  'getSubcompanyById': {
    endpoint: '/subcompanies/{id}',
    params: ['id']
  },
  'deleteSubcompanyById': {
    endpoint: '/subcompanies/{id}',
    verb: 'DELETE',
    params: ['id']
  },
  // ----- Documents (by id or by identifier)
  // TODO: Get document (search with tons of params)
  // TODO: Post document (which params?)
  'getDocumentById': {
    endpoint: '/documents/{id}',
    params: ['id'] // Or generate params directly from `endpoint`?
    // TODO: body ≠ GET params
  },
  'deleteDocumentById': {
    endpoint: '/documents/{id}',
    verb: 'DELETE',
    params: ['id']
  },
  // ----- Users
  'getUsers': {
    endpoint: '/users'
  },
  'postUsers': {
    endpoint: '/users',
    verb: 'POST',
    body: ['email', 'name', 'password', 'is_admin']
  },
  'getUserById': {
    endpoint: '/users/{id}',
    params: ['id']
  },
  'deleteUserById': {
    endpoint: '/users/{id}',
    verb: 'DELETE',
    params: ['id'],
    expectedStatus: 204
  },
  // ----- Document types
  'getDocumentTypes': {
    endpoint: '/document_types'
  },
  // ----- Providers
  'getProviders': {
    endpoint: '/providers'
  },
}

var generateMapping = function(config) {
  // `config` extends the default descriptor
  for(var i in defaultDescriptor) {
    if (!config[i])
      config[i] = defaultDescriptor[i];
  }

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
var mappingFunctions = {};
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

// TODO: more complex syntax: getDocumentById(123).getRelated(cb);