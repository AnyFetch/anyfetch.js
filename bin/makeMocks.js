'use strict';
/**
 * @file Make a call to each endpoint and record the response (code, body, ...)
 * in JSON files (one file per request).
 * It is useful to create the mock responses used in testing.
 * @see http://developers.anyfetch.com/endpoints/
 */

var fs = require('fs');

var extendDefaults = require('../lib/helpers/extend-defaults.js');
var filename = require('../lib/helpers/endpoint-filename.js');

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

var defaultDescriptor = require('../config/json/default-descriptor.json');
var apiDescriptors = require('../config/json/api-descriptors.json');
var mocksDirectory = __dirname + '/../lib/test-server/mocks/';

var saveMock = function(endpointConfig, body) {
  // We'll write pretty JSON
  var json = JSON.stringify(body, null, 2);
  var target = filename(endpointConfig) + '.json';
  fs.writeFile(mocksDirectory + target, json, function(err) {
    if(err) {
      throw err;
    }
    console.log(target + ' saved.');
  });
};

var mockSimpleEndpoint = function(name) {
  anyfetch[name](function(err, res){
    var config = apiDescriptors[name];
    extendDefaults(config, defaultDescriptor);

    saveMock(config, res.body);
  });
};

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}
var anyfetch = new Anyfetch(configuration.test.login, configuration.test.password);

var simpleEndpoints = [
  'getStatus',
  'getIndex',
  'getToken',
  'getCompany',
  'getSubcompanies',
  'postCompanyUpdate',
  'getDocuments',
  'getUsers',
  'getDocumentTypes',
  'getProviders'
];

for(var i in simpleEndpoints) {
  mockSimpleEndpoint(simpleEndpoints[i]);
}
