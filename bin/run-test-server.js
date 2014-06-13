'use strict';

var testServer = require('../lib/test-server/index.js');
var configuration = require('../config/configuration.js');

var port = configuration.test.port;
testServer.listen(port, function() {
  console.log('Test server listening on port ' + port);
});
