'use strict';

var createTestServer = require('../lib/test-server/index.js');
var configuration = require('../config/configuration.js');

var port = configuration.test.port;

var testServer = createTestServer();
testServer.listen(port, function() {
  console.log('Test server listening on port ' + port);
});