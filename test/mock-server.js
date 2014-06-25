'use strict';

var createMockServer = require('../lib/test-server/index.js');
var configuration = require('../config/configuration.js');

describe('<Mock server>', function() {

  before(function(done) {
    var server = createMockServer();
    var port = configuration.test.port;
    server.listen(port, function() {
      console.log('Mock server running on port ' + port);
      done();
    });
  });

  it('should handle batch calls smartly', function(done) {
    // TODO
    done();
  });

});