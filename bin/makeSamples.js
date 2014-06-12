'use strict';
/**
 * @file Make a call to each endpoint and record the response (code, body, ...)
 * in JSON files (one file per request).
 * It is useful to create the mock responses used in testing.
 * @see http://developers.anyfetch.com/endpoints/
 */

var configuration = require('../config/configuration.js');
var Anyfetch = require('../lib/index.js');

var anyfetch = new Anyfetch(configuration.accessToken);

anyfetch.getStatus(function(err, res){
  console.log(res.body);
});