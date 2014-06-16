'use strict';

var extendDefault = require('../lib/helpers/extend-defaults.js');

var defaultDescriptor = require('../config/json/default-descriptor.json');
var apiDescriptors = require('../config/json/api-descriptors.json');

/**
 * Extend the descriptors (extend subfunctions as well)
 */
var extendAllDescriptors = function(descriptors, defaultDescriptor) {
  for (var name in descriptors) {
    extendDefault(descriptors[name], defaultDescriptor);

    // While we're at it, convert the verb to a valid method name
    var verb = descriptors[name].verb;
    descriptors[name].method = (verb === 'DELETE' ? 'del' : verb.toLowerCase());

    // The sub-functions extend this descriptor
    for (var subName in descriptors[name].subFunctions) {
      var subConfig = descriptors[name].subFunctions[subName];
       extendDefault(subConfig, descriptors[name]);
       subConfig.endpoint = descriptors[name].endpoint + subConfig.endpoint;
       delete subConfig.subFunctions;
    }
  }

  return descriptors;
};

module.exports = {
  // Mapping descriptors from JSON files
  aliases: require('../config/json/aliases.json'),
  apiDescriptors: extendAllDescriptors(apiDescriptors, defaultDescriptor),

  apiHost: process.env.API_HOST || 'https://api.anyfetch.com',

  // Warning: the USERNAME env variable can be used by the OS
  test: {
    port: process.env.PORT || '50000',
    login: process.env.LOGIN,
    password: process.env.PASSWORD,

    fakeUser: {
      email: 'thechuck' + Math.round(Math.random() * 1337) + '@norris.com',
      name: 'Chuck Norris',
      password: 'no_need',
      is_admin: true
    },
    fakeCompany: {
      name: 'the_fake_subcompany',
      hydraters: [
        "http://localhost:5000/plaintext/hydrate",
        "http://localhost:5000/pdf/hydrate"
      ]
    },
    fakeDocument: {
      identifier: 'the "unique" document identifier (éüà)',
      document_type: 'file',
      data: {
        foo: 'some_string'
      },
      metadata: {
        some_key: 'some random sentence'
      }
    },
    fakeFile: {
      path: __dirname + '/../test/samples/hello.txt',
      filename: 'hello',
      contentType: 'text/plain'
    }
  }
};