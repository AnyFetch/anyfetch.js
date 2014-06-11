"use strict";

/**
 * @return Whether `f` is a function
 */
module.exports = function isFunction(f) {
  return !!(f && f.constructor && f.call && f.apply);
};
