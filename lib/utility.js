'use strict';

/**
 * @file High-level helper functions for common Fetch API use-cases.
 */

var autoload = require('auto-load');

/**
 * Extend the prototype of Anyfetch with helper functions
 */
module.exports = function addHelpers(Anyfetch) {

  var loaded = autoload(__dirname + '/utility');
  for(var name in loaded) {
    Anyfetch.prototype[name] = loaded[name];
  }

  return Anyfetch;
};