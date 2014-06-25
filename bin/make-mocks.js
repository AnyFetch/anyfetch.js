'use strict';
/**
 * @file Make a call to each endpoint and record the response (code, body, ...)
 * in JSON files (one file per request).
 * It is useful to create the mock responses used in testing.
 * @see http://developers.anyfetch.com/endpoints/
 */

var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var util = require('util');

var filename = require('../lib/helpers/endpoint-filename.js');

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}
var anyfetch = new Anyfetch(configuration.test.login, configuration.test.password);
var mocksDirectory = __dirname + '/../lib/test-server/mocks/';

/**
 * Save the response's body, at least if it's not empty
 */
var saveMock = function(endpointConfig, body) {
  if (endpointConfig.expectedStatus !== 204 && Object.keys(body).length > 0) {
    // We'll write pretty JSON
    var json = JSON.stringify(body, null, 2);
    var target = filename(endpointConfig) + '.json';
    fs.writeFile(mocksDirectory + target, json, function(err) {
      if(err) {
        throw err;
      }
      console.log(target + ' saved.');
    });
  }
};

var mockEndpoint = function(name, args, cb) {
  if (!configuration.apiDescriptors[name]) {
    throw new Error('The endpoint ' + name + ' is not specified.');
  }

  // Add callback
  args.push(function(err, res){
    var body = res.body || null;
    saveMock(configuration.apiDescriptors[name], body);
    cb(err);
  });

  anyfetch[name].apply(anyfetch, args);
};

// ----- Make sure the output directory exists
mkdirp(mocksDirectory, function(err) {
  if(err) {
    throw new Error(err);
  }

  // ----- Fill with fake content
  var userId;
  var anyChuck;
  var subcompanyId;
  var documentId;
  var documentIdentifier = configuration.test.fakeDocument.identifier;

  anyfetch.getToken(function(err, res) {
    if(err) {
      throw err;
    }
    saveMock(configuration.apiDescriptors.getToken, res.body);

    anyfetch = new Anyfetch(res.body.token);

    async.auto({
      getCurrentUser: function(cb) {
        anyfetch.getCurrentUser(function(err, user) {
          userId = user.id;
          cb(err);
        });
      },

      postUsers: function(cb) {
        anyfetch.postUsers(configuration.test.fakeUser, function(err, res) {
          if(res.body && res.body.id) {
            saveMock(configuration.apiDescriptors.postUsers, res.body);
          }
          cb(err);
        });
      },

      /**
       * We need to create the subcompany from an admin user,
       * who will be moved into the subcompany.
       */
      postSubcompanies: ['postUsers', function(cb) {
        anyChuck = new Anyfetch(configuration.test.fakeUser.email, configuration.test.fakeUser.password);

        anyChuck.postSubcompanies(configuration.test.fakeCompany, function(err, res) {
          // The fake user is now the first admin of the new company
          if(res.body && res.body.id) {
            subcompanyId = res.body.id;
            saveMock(configuration.apiDescriptors.postSubcompanies, res.body);
          }
          cb(err);
        });
      }],

      postDocuments: function(cb) {
        anyfetch.postDocuments(configuration.test.fakeDocument, function(err, res) {
          if(res.body && res.body.id) {
            documentId = res.body.id;
            saveMock(configuration.apiDescriptors.postDocuments, res.body);
          }
          cb(err);
        });
      },

      postDocumentsFile: ['postDocuments', function(cb) {
        var hash = configuration.test.fakeFile;
        hash.file = fs.createReadStream(hash.path);
        anyfetch.getDocumentById(documentId).postFile(hash, function(err) {
          // No mock to save, response is expected to be empty
          cb(err);
        });
      }],

      // Now the fake content is setup, we can test all the gets in parallel
      endpoints: ['getCurrentUser', 'postSubcompanies', 'postDocumentsFile', function(cb) {
        var endpoints = [
          'getDocuments',
          'getStatus',
          'getIndex',
          'getCompany',
          'getSubcompanies',
          'postCompanyUpdate',
          'getUsers',
          'getDocumentTypes',
          'getProviders',
          ['getSubcompaniesById', subcompanyId],
          ['getDocumentsById', documentId],
          ['getDocumentsByIdentifier', documentIdentifier],
          ['getUsersById', userId],
        ];

        // Only proceed when all of them are done
        async.map(endpoints, function(args, cb) {
          if(util.isArray(args)) {
            var endpoint = args.shift();
            mockEndpoint(endpoint, args, cb);
          }
          else {
            mockEndpoint(args, [], cb);
          }
        }, cb);
      }],

      // Subfunctions of getDocumentById
      subFunctions: ['postDocumentsFile', function(cb) {
        var subs = [
          'getSimilar',
          'getRelated',
          'getRaw',
          // Empty response because file is deleted right after hydration
          'getFile'
        ];
        var pre = anyfetch.getDocumentsById(documentId);
        var c = configuration.apiDescriptors.getDocumentsById.subFunctions;

        async.map(subs, function(name, cb){
          pre[name](function(err, res) {
            saveMock(c[name], res.body);
            cb(err);
          });
        }, cb);
      }]

    }, function(err) {
      // ----- Clean up in parallel
      async.parallel({

        deleteSubcompanyById: function(cb) {
          // The fake user, who's inside this subcompany, will get deleted as well
          anyfetch.deleteSubcompanyById(subcompanyId, {}, cb);
        },

        deleteDocumentByIdentifier: function(cb) {
          anyfetch.deleteDocumentsByIdentifier(documentIdentifier, cb);
        }

      }, function(cleanupErr) {
        // A bit weird, but we'd like to try and clean-up even if there's
        // been an error
        if(err) {
          throw err;
        }
        if(cleanupErr) {
          throw cleanupErr;
        }
      });
    });

  });

});
