'use strict';

/**
 * Usage: `node bin/make-doc.js`
 * Use this file to generate a reference sheet listing all mapping functions
 * with their arguments.
 *
 * @warning When a function is aliased, we show only the aliased name.
 */

var fs = require('fs');
var config = require('../config/configuration.js');

var outputFilename = 'reference.md';
var header = 'Mappings\n========\n';
header += 'These functions are the easiest way to request the AnyFetch API. Each function corresponds directly to an endpoint: **please see the [full API reference](http://developers.anyfetch.com/endpoints/)**.\n\n';
header += 'Most callbacks are expected to be of the form: `function cb(err, res)`, where `res` is a [SuperAgent Response object](http://visionmedia.github.io/superagent/#response-properties) directly representing the reponse obtained from the API.\n';

var applyAliases = function(descriptors, aliases) {
  Object.keys(aliases).forEach(function(alias) {
    var original = aliases[alias];
    descriptors[alias] = descriptors[original];
    delete descriptors[original];
  });
}

var groupByEndpoint = function(descriptors) {
  var grouped = {};

  Object.keys(descriptors).forEach(function(functionName) {
    var endpoint = descriptors[functionName].endpoint;
    if(!grouped[endpoint]) {
      grouped[endpoint] = {};
    }

    grouped[endpoint][functionName] = descriptors[functionName];
  });

  return grouped;
};

var generateSignature = function(functionName, descriptor) {
  var args = [];
  var details = '';
  if(descriptor.requireId) {
    args.push('id');
    details += '  - `id` (string): a valid MongoDB ObjectId\n';
  }
  if(descriptor.requireIdentifier) {
    args.push('identifier');
    details += '  - `identifier` (string): the custom identifier set for your document\n';
  }
  if(descriptor.params) {
    args.push('[params]');
    var params = descriptor.params.map(function(param){
      return '`' + param + '`';
    });
    details += '  - `params` (object): will be passed as GET parameters.\n';
    details += '  Supported keys: ' + params.join(', ') + '\n';
  }
  if(descriptor.body) {
    args.push('[body]');
    var body = descriptor.body.map(function(key){
      return '`' + key + '`';
    });

    details += '  - `body` (object): will be sent as the request\'s body (POST).\n';
    details += '  Supported keys: ' + body.join(', ') + '\n';
  }
  args.push('cb');

  var result = '**`' + functionName + '(' + args.join(', ') + ')`**';
  if(details) {
    result += ':\n\n- Arguments:\n' + details;
  }
  else {
    result += '\n';
  }
  return result;
}

var generateBody = function(descriptorsByEndpoint) {
  var body = '## Mapping functions ordered by API endpoint\n\n';

  var endpoints = Object.keys(descriptorsByEndpoint);
  endpoints.sort();

  endpoints.forEach(function(endpoint) {
    var descriptors = descriptorsByEndpoint[endpoint];

    body += '### `' + endpoint + '` endpoint\n\n';

    for(var functionName in descriptors) {
      var descriptor = descriptors[functionName];
      body += generateSignature(functionName, descriptor);

      if(descriptor.subFunctions) {
        body += '\n- **Subfunctions**:';
        for(var subFunctionName in descriptor.subFunctions) {
          var subDescriptor = descriptor.subFunctions[subFunctionName];
          var subFunction = generateSignature(functionName + '(id).' + subFunctionName, subDescriptor);

          // Add indentation
          subFunction = subFunction.replace(/\n/gi, '\n    ');

          body += '\n  - ' + subFunction;
        }
      }

      body += '\n';
    }
  });

  return body;
}

var writeMarkdown = function(content) {
  fs.writeFileSync(outputFilename, content);
};

var make = function() {
  applyAliases(config.apiDescriptors, config.aliases);
  var grouped = groupByEndpoint(config.apiDescriptors);

  var body = generateBody(grouped);

  writeMarkdown(header + body);

  console.log('Reference documentation written to ' + outputFilename);
  process.exit(0);
}

make();
