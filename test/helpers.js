'use strict';

var should = require('should');

var Anyfetch = require('../lib/helpers.js');
var configuration = require('../config/configuration.js');

// TODO: use mock server (improve it to handle batch requests)

describe('<High-level helper functions>', function() {
  var anyfetch;
  var anyfetchBasic = new Anyfetch(configuration.test.login, configuration.test.password);

  // Retrieve token from credentials
  before(function(done) {
    anyfetchBasic.getToken(function(err, res) {
      anyfetch = new Anyfetch(res.body.token);
      done(err);
    });
  });

  describe('getDocumentWithInfo', function() {
    it('should get document and populate `document_type` and `provider`', function(done) {
      anyfetch.getDocumentWithInfo('53a14e0ad9d493b510e4191b', function(err, doc) {
        should(err).not.be.ok;
        should(doc).be.ok;
        doc.should.have.properties('id', 'identifier', 'provider', 'document_type');
        doc.provider.should.have.properties('client', 'name', 'document_count');
        doc.document_type.should.have.properties('id', 'name', 'templates');

        done(err);
      });
    });
  });

  describe('getCurrentUser', function() {
    it('should get the correct user', function(done) {
      anyfetch.getCurrentUser(function(err, user) {
        should(err).not.be.ok;
        should(user).be.ok;
        should(user).have.properties('id', 'email', 'name', 'is_admin');
        user.email.should.eql(configuration.test.login);

        done(err);
      });
    });
  });

});

