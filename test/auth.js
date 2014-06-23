'use strict';

var should = require('should');

var auth = require('../lib/auth.js');
var createFakeManagerServer = require('./helpers/fake-manager-server.js');
var configuration = require('../config/configuration.js');

describe('<Auth>', function() {

  describe('getAccessToken', function() {
    var appId = configuration.test.fakeAppId;
    var appSecret = configuration.test.fakeAppSecret;
    var code = configuration.test.fakeOAuthCode;
    var redirectUri = 'http://localhost:5000';

    before(function(done) {
      var fakeManagerServer = createFakeManagerServer();
      var port = configuration.test.managerPort;

      fakeManagerServer.listen(port, function() {
        console.log('Fake Manager server running on port ' + port);
        auth.setManagerHost('http://localhost:' + port);
        done();
      });
    });

    it('should err on invalid appId', function(done) {
      auth.getAccessToken('wrong_app_id', appSecret, code, redirectUri, function(err) {
        should(err).be.ok;
        err.message.should.match(/404/);
        done();
      });
    });

    it('should err on missing code', function(done) {
      auth.getAccessToken(appId, appSecret, '', redirectUri, function(err) {
        should(err).be.ok;
        err.message.should.match(/409/);
        done();
      });
    });

    it('should obtain access token', function(done) {
      auth.getAccessToken(appId, appSecret, code, redirectUri, function(err, accessToken) {
        accessToken.should.equal(configuration.test.fakeAccessToken);
        done(err);
      });
    });

    it('should allow `redirect_uri` to be omitted', function(done) {
      auth.getAccessToken(appId, appSecret, code, function(err, accessToken) {
        accessToken.should.equal(configuration.test.fakeAccessToken);
        done(err);
      });
    });

  });

});