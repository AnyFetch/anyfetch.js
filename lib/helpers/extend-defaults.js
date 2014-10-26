'use strict';

/**
 * Extend the properties of `defaults` by those specified in `extended`.
 * @warning The result is directly written in `extended`.
 * @warning This is a shallow copy only
 * @return The extended object
 */
module.exports = function extendDefaults(extended, defaults) {
  for(var i in defaults) {
    if(!extended[i]) {
      extended[i] = defaults[i];
    }
  }
  return extended;
};
