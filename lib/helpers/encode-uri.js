'use strict';

/**
 * Encode the given string through `encodeURIComponent`
 * and encode parenthesis as well.
 * This is needed to avoid an nginx error (method not allowed)
 */
module.exports = function encodeURIComponentAndParentheses(string) {
  string = encodeURIComponent(string);
  string = string.replace(/\(/g, "%28");
  string = string.replace(/\)/g, "%29");
  return string;
};
