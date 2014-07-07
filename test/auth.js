'use strict';

var should = require('should');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

describe('<Auth>', function() {

  describe('getAccessToken', function() {
    var appId = configuration.test.fakeAppId;
    var appSecret = configuration.test.fakeAppSecret;
    var code = configuration.test.fakeOAuthCode;
    var mockServer;

    before(function launchServer(done) {
      mockServer = AnyFetch.createMockServer();
      var port = configuration.test.managerPort;

      mockServer.listen(port, function() {
        console.log('Mock server running on port ' + port);
        AnyFetch.setManagerUrl('http://localhost:' + port);
        done();
      });
    });

    it('should err on missing code', function(done) {
      AnyFetch.getAccessToken(appId, appSecret, '', function(err) {
        should(err).have.property('message').and.match(/409/);
        done();
      });
    });

    it('should obtain access token', function(done) {
      AnyFetch.getAccessToken(appId, appSecret, code, function(err, accessToken) {
        should(accessToken).be.ok;
        accessToken.should.equal(configuration.test.fakeAccessToken);
        done(err);
      });
    });

    after(function closeServer() {
      mockServer.close();
    });
  });
});
