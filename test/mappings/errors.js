'use strict';

var should = require('should');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instanciateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('Errors', function() {
    it('should throw an error when not passing a callback function', function() {
      try {
        anyfetch.getIndex(null);
      } catch(err) {
        should(err).be.ok;
        err.message.toLowerCase().should.containEql('last argument must be a function');
      }
    });

    it('should err synchronously when passing an invalid POST argument', function(done) {
      anyfetch.postUser({ random_key: 'random_value' }, function(err) {
        should(err).be.ok;
        err.message.toLowerCase().should.containEql('random_key');
        err.message.toLowerCase().should.containEql('not allowed in this request\'s body');
        done();
      });
    });

    it('should err synchronously when passing an invalid GET parameter', function(done) {
      anyfetch.getBatch({ random_key: 'random_value' }, function(err) {
        should(err).be.ok;
        err.message.toLowerCase().should.containEql('random_key');
        err.message.toLowerCase().should.containEql('not allowed in this request\'s get parameters');
        done();
      });
    });
  });
});
