'use strict';

var should = require('should');

var AnyFetch = require('../../lib/index.js');
require('../helpers/reset-to-bearer.js');
var configuration = require('../../config/configuration.js');

describe('<Low-level mapping functions>', function() {
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  describe('Errors', function() {
    it('should throw when setting apiUrl to null', function() {
      try {
        anyfetch.setApiUrl(null);
      } catch(err) {
        should(err).be.ok;
        err.message.should.match(/cannot set apiUrl/i);
      }
    });
    it('should throw when setting managerUrl to null', function() {
      try {
        anyfetch.setManagerUrl(null);
      } catch(err) {
        should(err).be.ok;
        err.message.should.match(/cannot set managerUrl/i);
      }
    });

    it('should throw an error when not passing a callback function', function() {
      try {
        anyfetch.getIndex(null);
      } catch(err) {
        should(err).be.ok;
        err.message.should.match(/last argument must be a function/i);
      }
    });

    it('should err synchronously when passing an invalid POST argument', function(done) {
      anyfetch.postUser({ random_key: 'random_value' }, function(err) {
        should(err).be.ok;
        err.message.should.match(/random_key/i);
        err.message.should.match(/not allowed in this request\'s body/i);
        done();
      });
    });

    it('should err synchronously when passing an invalid GET parameter', function(done) {
      anyfetch.getBatch({ random_key: 'random_value' }, function(err) {
        should(err).be.ok;
        err.message.should.match(/random_key/i);
        err.message.should.match(/not allowed in this request\'s get parameters/i);
        done();
      });
    });
  });
});
