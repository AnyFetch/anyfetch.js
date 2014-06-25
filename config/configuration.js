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
  managerHost: process.env.MANAGER_HOST || 'https://manager.anyfetch.com',
  oAuthEndpoint: '/oauth/access_token',

  // Warning: the USERNAME env variable can be used by the OS
  test: {
    port: process.env.PORT || '50000',
    managerPort: process.env.MANAGER_TEST_PORT || '50001',
    login: process.env.LOGIN,
    password: process.env.PASSWORD,

    fakeAppId: '53a7ef7b3b28ab0c7c46863c',
    fakeAppSecret: '88dc117fd640df09fe94f409476132484267e361567744879b20c2ba2a6c0944',
    fakeOAuthCode: '6e9ea0bfea7581b51c56195e5bd32634eb911cae',
    fakeAccessToken: '0d7d5dd28e615b2d31cf648df4a5a279e509945b',
    fakeUser: {
      email: 'thechuck' + Math.round(Math.random() * 1337) + '@norris.com',
      name: 'Chuck Norris',
      password: 'no_need',
      is_admin: true
    },
    fakeCompany: {
      name: 'the_fake_subcompany',
      hydraters: [
        'http://plaintext.hydrater.anyfetch.com/hydrate',
        'http://pdf.hydrater.anyfetch.com/hydrate',
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
    fakeDocument2: {
      identifier: 'some other document',
      document_type: 'file',
      data: {
        foo: 'some_other_string'
      },
      metadata: {
        some_key: 'some different random sentence'
      }
    },
    fakeFile: {
      path: __dirname + '/../test/samples/hello.md',
      filename: 'hello',
      contentType: 'text/plain'
    },
    fakeImageFile: {
      path: __dirname + '/../test/samples/hello.jpg',
      filename: 'hello_image',
      contentType: 'image/jpeg'
    }
  }
};