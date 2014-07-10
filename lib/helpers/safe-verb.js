'use strict';

/**
 * @return {String} The sanitized HTTP verb: to lower case, 'DELETE' replaced by 'del'
 */
module.exports = function safeVerb(verb) {
  return (verb === 'DELETE' ? 'del' : verb.toLowerCase());
};
