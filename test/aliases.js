'use strict';

require('should');

var AnyFetch = require('../lib/index.js');
var configuration = require('../config/configuration.js');

/**
 * @file Test that all aliases refer to their original function
 */
describe('<Aliases>', function() {
  var aliases = configuration.aliases;
  var anyfetch;
  before(function instantiateClient() {
    anyfetch = new AnyFetch(configuration.test.user.email, configuration.test.user.password);
  });

  Object.keys(aliases).forEach(function(newName) {
    var oldName = aliases[newName];
    describe(newName + ' <-- ' + oldName, function() {
      it('should refer to the same function', function() {
        anyfetch[newName].should.equal(anyfetch[oldName]);
      });
    });
  });
});
