'use strict';

require('should');
var restify = require('restify');

var CluestrClient = require('../lib/cluestr.js/index.js');

describe.skip('Client environnment', function() {
  it('should allow to override Cluestr API url', function(done) {
    var datas = {
      'identifier': 'fake_identifier',
      'binary_document_type': 'file',
      'metadatas': {
        'foo': 'bar'
      }
    };

    process.env.CLUESTR_SERVER = 'http://localhost:1337';

    var fakeCluestrServer = restify.createServer();

    fakeCluestrServer.use(restify.acceptParser(fakeCluestrServer.acceptable));
    fakeCluestrServer.use(restify.queryParser());
    fakeCluestrServer.use(restify.bodyParser());

    fakeCluestrServer.post('/providers/documents', function(req, res, next) {
      // Return data "as is", plus the Authorization header.
      var ret = req.params;
      ret.authorization = req.headers.authorization;
      res.send(ret);
      next(200);
    });

    fakeCluestrServer.listen(1337);

    var cluestrClient = new CluestrClient('fake_app_id', 'fake_app_secret');
    cluestrClient.setAccessToken("fake_access_token");
    cluestrClient.sendDocument(datas, function(err, body) {
      if(err) {
        throw err;
      }

      var expectedReturn = datas;
      expectedReturn.authorization = "token fake_access_token";
      body.should.eql(expectedReturn);

      fakeCluestrServer.close(done);
    });
  });

  it('should allow to override Cluestr Front url', function(done) {

    process.env.CLUESTR_FRONT = 'http://localhost:1337';

    var fakeCluestrServer = restify.createServer();

    fakeCluestrServer.use(restify.acceptParser(fakeCluestrServer.acceptable));
    fakeCluestrServer.use(restify.queryParser());
    fakeCluestrServer.use(restify.bodyParser());

    fakeCluestrServer.post('/oauth/token', function(req, res, next) {
      res.send({access_token: 'fake_access_token'});
      next(200);
    });

    fakeCluestrServer.listen(1337);

    var cluestrClient = new CluestrClient('fake_app_id', 'fake_app_secret');
    cluestrClient.getAccessToken("fake_code", "fake_redirect_uri", function(err, accessToken) {
      if(err) {
        throw err;
      }

      accessToken.should.equal("fake_access_token");

      fakeCluestrServer.close(done);

    });
  });
});
