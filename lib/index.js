'use strict';
/**
 * @file Easy access to AnyFetch API.
 *
 * @see http://anyFetch.com
 */
 // TODO: migrate to supertest
var request = require('request')
var util = require('util');

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
  'postSubcompanies': {
    endpoint: '/subcompanies',
    verb: 'POST',
    body: ['name', 'hydraters']
  },
  'getSubcompanyById': {
    endpoint: '/subcompanies/{id}',
    requireId: true
  },
  'deleteSubcompanyById': {
    endpoint: '/subcompanies/{id}',
    verb: 'DELETE',
    requireId: true,
    params: ['force']
  },
  
  // ----- Documents (by id or by identifier)
  'getDocuments': {
    endpoint: '/documents',
    // TODO: here, parameter `_meta` could actually be any key
    params: ['search', 'before', 'after','document_type', 'token', '_meta', 'has_meta', 'snippet_size', 'start', 'limit']
  },
  'postDocuments': {
    endpoint: '/documents',
    verb: 'POST',
    body: ['identifier', 'document_type', 'actions', 'data', 'metadata', 'related', 'user_access']
  },
  // TODO: Post document file (with id param, with multipart form upload)
  'getDocumentById': {
    endpoint: '/documents/{id}',
    requireId: true // Or generate params directly from `endpoint`?
    // TODO: body ≠ GET params
  },
  'deleteDocumentById': {
    endpoint: '/documents/{id}',
    verb: 'DELETE',
    requireId: true
  },
  
  // ----- Users
  'getUsers': {
    endpoint: '/users'
  },
  // TODO: rename to `postUser` for clarity? (but that would break the naming convention)
  'postUsers': {
    endpoint: '/users',
    verb: 'POST',
    body: ['email', 'name', 'password', 'is_admin']
  },
  'getUserById': {
    endpoint: '/users/{id}',
    requireId: true
  },
  'deleteUserById': {
    endpoint: '/users/{id}',
    verb: 'DELETE',
    requireId: true,
    expectedStatus: 204
  },
  
  // ----- Document types
  'getDocumentTypes': {
    endpoint: '/document_types'
  },
  
  // ----- Providers
  'getProviders': {
    endpoint: '/providers'
  }
}

var generateMapping = function(config) {
  // `config` extends the default descriptor
  for(var i in defaultDescriptor) {
    if(!config[i])
      config[i] = defaultDescriptor[i];
  }

  return function() {
    // Convert arguments to an array
    var args = [];
    for (var i in arguments)
      args.push(arguments[i]);

    // We must support quite a lot of different call syntaxes
    var params = {},
        body = {};

    // cb is always the last parameter
    var cb = args.pop();

    if (config.body) {
      body = args.pop();
      // Make sure that every field of the body is accepted
      for(var key in body) {
        if(config.body.indexOf(key) < 0)
          return cb(new Error('Argument error, the key ' + key + ' is not allowed in this request\'s body'));
      }
    }

    if (config.params) {
      params = args.pop();
      // Make sure that every GET parameter is accepted
      for(var key in params) {
        if(config.params.indexOf(key) < 0)
          return cb(new Error('Argument error, the key ' + key + ' is not allowed in this request\'s GET parameters'));
      }
    }

    // id is always the first parameter (when it's actually required)
    if(config.requireId) {
      var id = args.pop();
      if(!isNaN(id)) {
        // Substitute id parameter in endpoint string
        config.endpoint = config.endpoint.replace('{id}', id);
      }
      else
        return cb(new Error('Argument error, the first parameter must be a numeric id'));
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
      if(res.statusCode != config.expectedStatus)
        return cb(new Error('Received code ' + res.statusCode + ', expected ' + config.expectedStatus));

      cb(err, body);
    });
  };
};

// Generate the function for each endpoint
var mappingFunctions = {};
for (var name in mappingDescriptor) {
  mappingFunctions[name] = generateMapping(mappingDescriptor[name]);
}

// TODO: add nice semantic aliases
// E.g. postSubcompany --> postSubcompanies
// What is actually done is to post ONE company, so it makes more sense)

// TODO: more complex syntax: getDocumentById(123).getRelated(cb);