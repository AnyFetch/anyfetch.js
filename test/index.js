'use strict';

require('should');

var CluestrClient = require('../lib/cluestr.js/index.js');

/**
 * Check environment is set up.
 */
before(function() {
  var keys = ['CLUESTR_ID', 'CLUESTR_SECRET'];
  keys.forEach(function(key) {
    if(!process.env[key]) {
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
