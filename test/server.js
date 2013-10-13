'use strict';

require('should');
var restify = require('restify');

var CluestrClient = require('../lib/cluestr.js/index.js');

describe('Client environnment', function() {
  it('should allow to override Cluestr API url', function(done) {
    // Is this test timeouting? This is due to should conditions being done beyond the standard event loop, and not properly bubbled up to Mocha.
    // So, in case of timeout, just uncomment the console.log a few lines below.

    var datas = {
      'identifier': 'fake_identifier',
      'binary_document_type': 'test_document_type',
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
      done();
    });
  });
});
