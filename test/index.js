'use strict';

require('should');

var CluestrClient = require('../lib/cluestr.js/index.js');

/**
 * Check environment is set up.
 */
before(function() {
  var keys = ['CLUESTR_ID', 'CLUESTR_SECRET', 'ACCESS_TOKEN'];
  keys.forEach(function(key) {
    if(!process.env[key]) {
      process.env[key] = 'fake';
      //throw new Error("To run this test suite, you need to specify environment variable " + key);
    }
  });
});


describe('getAccessToken()', function() {
  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);
  it('should crash on invalid values', function(done) {

    cluestrClient.getAccessToken("fake_code", "fake_uri",   function(err) {
      err.toString().should.include('401');
      err.toString().should.include('Client authentication failed');

      done();
    });
  });
});


describe('sendDocument()', function() {
  var cluestrClient = new CluestrClient(process.env.CLUESTR_ID, process.env.CLUESTR_SECRET);

  it('should require an accessToken', function(done) {
    cluestrClient.sendDocument({}, function(err) {
      err.toString().should.include('accessToken');
      done();
    });
  });

  it('should require an identifier', function(done) {
    cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);
    cluestrClient.sendDocument({}, function(err) {
      err.toString().should.include('identifier');
      done();
    });
  });

  it('should allow for noHydrate parameter', function(done) {
    cluestrClient.setAccessToken(process.env.ACCESS_TOKEN);
    cluestrClient.sendDocument({}, false, function(err) {
      err.toString().should.include('identifier');
      done();
    });
  });


});
