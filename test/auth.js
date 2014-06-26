'use strict';

var should = require('should');

var Anyfetch = require('../lib/index.js');
var createFakeManagerServer = require('./helpers/fake-manager-server.js');
var configuration = require('../config/configuration.js');

describe('<Auth>', function() {

  describe('getAccessToken', function() {
    var appId = configuration.test.fakeAppId;
    var appSecret = configuration.test.fakeAppSecret;
    var code = configuration.test.fakeOAuthCode;
    var fakeManagerServer;

    before(function launchServer(done) {
      fakeManagerServer = createFakeManagerServer();
      var port = configuration.test.managerPort;

      fakeManagerServer.listen(port, function() {
        console.log('Fake Manager server running on port ' + port);
        Anyfetch.setManagerHost('http://localhost:' + port);
        done();
      });
    });

    it('should err on invalid appId', function(done) {
      Anyfetch.getAccessToken('wrong_app_id', appSecret, code, function(err) {
        should(err).have.property('message').and.match(/404/);
        done();
      });
    });

    it('should err on invalid appSecret', function(done) {
      Anyfetch.getAccessToken(appId, 'wrong_app_secret', code, function(err) {
        should(err).have.property('message').and.match(/401/);
        done();
      });
    });

    it('should err on missing code', function(done) {
      Anyfetch.getAccessToken(appId, appSecret, '', function(err) {
        should(err).have.property('message').and.match(/409/);
        done();
      });
    });

    it('should obtain access token', function(done) {
      Anyfetch.getAccessToken(appId, appSecret, code, function(err, accessToken) {
        should(accessToken).be.ok;
        accessToken.should.equal(configuration.test.fakeAccessToken);
        done(err);
      });
    });

    after(function closeServer() {
      fakeManagerServer.close();
    });
  });
});