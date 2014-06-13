'use strict';
/**
 * @file Make a call to each endpoint and record the response (code, body, ...)
 * in JSON files (one file per request).
 * It is useful to create the mock responses used in testing.
 * @see http://developers.anyfetch.com/endpoints/
 */

var fs = require('fs');
var async = require('async');

var filename = require('../lib/helpers/endpoint-filename.js');

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}
var anyfetch = new Anyfetch(configuration.test.login, configuration.test.password);
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

var mockEndpoint = function(name, args, cb) {
  if (!cb) {
    cb = args;
    args = null;
  }
  args = args || [];
  if (!configuration.apiDescriptors[name]) {
    throw new Error('The endpoint ' + name + ' is not specified.');
  }

  // Add callback
  args.push(function(err, res){
    res = res || {body: {}};
    saveMock(configuration.apiDescriptors[name], res.body);
    cb(err);
  });

  anyfetch[name].apply(anyfetch, args);
};

// ----- Fill with fake content
var subcompanyId;
var documentId;
var documentIdentifier = 'the "unique" document identifier (éüà)';
var userId;

anyfetch.getToken(function(err, res) {
  if(err) {
    throw err;
  }
  saveMock(configuration.apiDescriptors.getToken, res.body);

  anyfetch = new Anyfetch(res.body.token);
  async.series({

    postUsers: function(cb) {
      anyfetch.postUsers({
        email: 'thechuck' + Math.round(Math.random() * 1337) + '@norris.com',
        name: 'Chuck Norris',
        password: 'no_need',
        is_admin: false
      }, function(err, res) {
        if(res.body && res.body.id) {
          userId = res.body.id;
          saveMock(configuration.apiDescriptors.postUsers, res.body);
        }
        cb(err);
      });
    },

    // postSubcompanies: function(cb) {
    //   anyfetch.postSubcompanies({
    //     name: 'the_fake_subcompany',
    //     hydraters: [
    //       "http://localhost:5000/plaintext/hydrate",
    //       "http://localhost:5000/pdf/hydrate"
    //     ]
    //   }, function(err, res) {
    //     if(res.body && res.body.id) {
    //       subcompanyId = res.body.id;
    //       saveMock(configuration.apiDescriptors.postSubcompanies, res.body);
    //     }
    //     cb(err);
    //   });
    // },

    postDocuments: function(cb) {
      anyfetch.postDocuments({
        identifier: documentIdentifier,
        document_type: 'file',
        data: {
          foo: 'some_string'
        },
        metadata: {
          some_key: 'some random sentence'
        }
      }, function(err, res) {
        if(res.body && res.body.id) {
          documentId = res.body.id;
          saveMock(configuration.apiDescriptors.postDocuments, res.body);
        }
        cb(err);
      });
    },

    postFile: function(cb) {
      // TODO
      cb(null);
    },

    // Now the fake content is setup, we can test all the gets in parallel
    simpleEndpoints: function(cb) {
      var simpleEndpoints = [
        'getStatus',
        // 'getIndex',
        // 'getCompany',
        // 'getSubcompanies',
        // 'postCompanyUpdate',
        'getDocuments',
        'getUsers',
        // 'getDocumentTypes',
        // 'getProviders'
      ];
      var ids = {
        // 'getSubcompaniesById': subcompanyId,
        // 'getDocumentsById': documentId,
        // 'getDocumentsByIdentifier': documentIdentifier,
        // 'getUsersById': userId
      };

      // TODO: use Async.map
      var mockers = [];
      for(var i in simpleEndpoints) {
        mockers.push(function(name) {
          mockEndpoint(name);
        }.bind(null, simpleEndpoints[i]));
      }
      for(var name in ids) {
        mockers.push(function(k) {
          mockEndpoint(k, [ids[k]]);
        }.bind(null, name));
      }

      // Only proceed when all of them are done
      async.parallel(mockers, cb);
    },

    subFunctions: function(cb) {
      // TODO: getRaw, getRelated, etc
      cb(null);
    },

    // ----- Clean up in parallel
    cleanUp: function(cb) {
      async.parallel({

        deleteUserById: function(cb) {
          anyfetch.deleteUserById(userId, function(err, res) {
            saveMock(configuration.apiDescriptors.deleteUserById, res.body);
            cb(err);
          });
        },

        // deleteSubcompanyById: function(cb) {
        //   anyfetch.deleteSubcompanyById(subcompanyId, function(err, res) {
        //     saveMock(configuration.apiDescriptors.deleteSubcompanyById, res.body);
        //     cb(err);
        //   });
        // },

        deleteDocumentByIdentifier: function(cb) {
          anyfetch.deleteDocumentByIdentifier(documentIdentifier, function(err, res) {
            saveMock(configuration.apiDescriptors.deleteSubcompanyById, res.body);
            cb(err);
          });
        }

      }, cb);
    },

  }, function(err) {
    if(err) {
      console.log(err);
    }
  });

});