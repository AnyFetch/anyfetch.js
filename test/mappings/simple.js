'use strict';

require('should');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  var testEndpoint = function(name) {
    describe(name, function() {
      var expected = configuration.apiDescriptors[name];
      var res = null;

      it('should carry out the request', function(done) {
        anyfetch[name](function(e, r) {
          res = r;
          done(e);
        });
      });

      it('should use the correct verb', function() {
        res.req.method.should.equal(expected.verb);
      });

      it('should target the correct endpoint', function() {
        res.req.path.should.equal(expected.endpoint);
      });

      it('should have the expected return code', function() {
        res.res.statusCode.should.equal(expected.expectedStatus);
      });
    });
  };

  testEndpoint('getStatus');
  testEndpoint('getIndex');
  testEndpoint('getCompany');
  testEndpoint('getSubcompanies');
  testEndpoint('postCompanyUpdate');
  testEndpoint('getDocuments');
  testEndpoint('getUser');
  testEndpoint('getUsers');
  testEndpoint('getDocumentTypes');
  testEndpoint('getProviders');
});
