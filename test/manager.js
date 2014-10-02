'use strict';

var should = require('should');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

describe('<Manager>', function() {
  var appId = configuration.test.fakeAppId;
  var appSecret = configuration.test.fakeAppSecret;
  var code = configuration.test.fakeOAuthCode;
  var token = configuration.test.fakeAccessToken;
  var mockServer;
  var anyfetch;

  before(function launchServer(done) {
    mockServer = AnyFetch.createMockServer();
    var port = configuration.test.managerPort;

    mockServer.listen(port, function() {
      console.log('Mock server running on port ' + port);
      AnyFetch.setManagerUrl('http://localhost:' + port);
      anyfetch = new AnyFetch(token);

      done();
    });
  });

  after(function closeServer() {
    mockServer.close();
  });


  describe('accessToken property', function() {
    it('should be exposed when instanciated with an access token', function() {
      should(anyfetch.accessToken).be.ok;
      anyfetch.accessToken.should.equal(token);
    });
  });

  describe('getAccessToken()', function() {
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
  });

  describe('getAvailableProviders()', function() {
    it('should run smoothly without any auth', function(done) {
      var options = {
        trusted: false,
        featured: false
      };
      AnyFetch.getAvailableProviders(options, function(err, res) {
        should(err).not.be.ok;
        should(res).be.ok;

        var providers = res.body;
        should(providers).be.ok;
        providers.should.be.instanceof(Array);
        providers.forEach(function(provider) {
          provider.should.have.properties('id', 'name', 'trusted');
        });

        done();
      });
    });

    it('should allow to omit options', function(done) {
      AnyFetch.getAvailableProviders(done);
    });

    it('should be able to restrict to trusted providers', function(done) {
      AnyFetch.getAvailableProviders({ trusted: true }, function(err, res) {
        should(err).not.be.ok;
        should(res).be.ok;

        var providers = res.body;
        should(providers).be.ok;
        providers.should.be.instanceof(Array);
        providers.forEach(function(provider) {
          provider.should.have.properties('id', 'name');
          provider.should.have.property('trusted', true);
        });

        done();
      });
    });

    it('should be able to restrict to featured providers', function(done) {
      AnyFetch.getAvailableProviders({ featured: true }, function(err, res) {
        should(err).not.be.ok;
        should(res).be.ok;

        var providers = res.body;
        should(providers).be.ok;
        providers.should.be.instanceof(Array);
        providers.forEach(function(provider) {
          provider.should.have.properties('id', 'name');
          provider.should.have.property('featured', true);
        });

        done();
      });
    });
  });

  describe('postAccountName()', function() {
    var accountName = 'my_dummy_account_name';

    it('should err when using Basic auth', function(done) {
      var bearerFetch = new AnyFetch('login', 'password');
      bearerFetch.postAccountName(accountName, function(err) {
        should(err).be.ok;
        err.message.should.match(/only available via bearer auth/i);
        done();
      });
    });

    it('should run smoothly', function(done) {
      anyfetch.postAccountName(accountName, done);
    });
  });

});
