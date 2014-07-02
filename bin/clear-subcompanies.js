'use strict';
/**
 * @file Delete all the subcompanies of this account
 * @see http://developers.anyfetch.com/endpoints/
 */

var configuration = require('../config/configuration.js');
var clearSubcompanies = require('../script/clear-subcompanies.js');

if(!configuration.test.rootLogin || !configuration.test.rootPassword) {
  throw new Error('This script requires valid LOGIN and PASSWORD to be set in your env');
}

clearSubcompanies(function(err) {
  if(err) {
    throw err;
  }

  console.log('All subcompanies deleted.');
  process.exit(0);
});
