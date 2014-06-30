'use strict';

var configuration = require('../config/configuration.js');
var clearSubcompanies = require('../script/clear-subcompanies.js');
var clearUsers = require('../script/clear-users.js');

if(!configuration.test.login || !configuration.test.password) {
  throw new Error('The test suite requires valid LOGIN and PASSWORD to be set in your env');
}

before(function clearTheSubcompanies(done) {
  console.log('Clearing subcompanies...');
  clearSubcompanies(done);
});
before(function clearTheUsers(done) {
  console.log('Clearing users...');
  clearUsers(done);
});

after(clearSubcompanies);
after(clearUsers);
