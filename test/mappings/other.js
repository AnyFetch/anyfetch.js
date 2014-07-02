'use strict';

var should = require('should');
var async = require('async');
var rarity = require('rarity');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('Basic authentication', function() {
    it('should retrieve token from credentials', function(done) {
      var anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
      anyfetch.getToken(function(err, res) {
        should(res).be.ok;
        should(res.body).be.ok;
        res.body.should.have.keys(['token']);
        done(err);
      });
    });
  });

  describe('getBatch', function() {
    var expected = configuration.apiDescriptors.getBatch;
    var res;
    var pages = [
      '/document_types',
      '/providers'
    ];

    it('should carry out the request', function(done) {
      anyfetch.getBatch({ pages: pages }, function(e, r) {
        res = r;
        done(e);
      });
    });

    it('should use the correct verb', function() {
      res.req.method.should.equal(expected.verb);
    });

    it('should target the correct endpoint', function() {
      res.req.path.should.startWith(expected.endpoint);
    });

    it('should have the expected return code', function() {
      res.res.statusCode.should.equal(expected.expectedStatus);
    });

    it('should respond with an object with one key per page', function() {
      res.body.should.have.keys(pages);
    });
  });

  describe('getProviderById', function() {
    it('should retrieve a single provider by its id', function(done) {
      // We use a dummy error to bail out of waterfall
      // Otherwise, it might cause a leak
      var noProvider = new Error('No provider available');

      async.waterfall([
        function getAlProviders(cb) {
          anyfetch.getProviders(cb);
        },
        function extractFirstId(res, cb) {
          var providerIds = Object.keys(res.body);
          if(!providerIds || providerIds.length < 1) {
            return cb(noProvider);
          }
          cb(null, providerIds[0]);
        },
        function getSingleProvider(id, cb) {
          anyfetch.getProviderById(id, rarity.carry(id, cb));
        },
        function checkProvider(id, res, cb) {
          var provider = res.body;
          provider.should.have.properties({ 'id': id });
          cb(null);
        }
      ], function(err) {
        // Do not fail if there's zero provider to test on
        if(err === noProvider) {
          return done();
        }
        done(err);
      });
    });
  });
});
