'use strict';
/**
 * @file Delete all the users (except the one who's logged in)
 * @see http://developers.anyfetch.com/endpoints/
 */

var configuration = require('../config/configuration.js');
var clearUsers = require('../script/clear-users.js');

if(!configuration.test.rootLogin || !configuration.test.rootPassword) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}

clearUsers(function(err) {
  if(err) {
    throw err;
  }

  console.log('All users deleted (except the one who\'s logged in).');
  process.exit(0);
});
