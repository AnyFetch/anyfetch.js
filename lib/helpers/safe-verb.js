'use strict';

/**
 * @return {String} The sanitized HTTP verb: to lower case, 'DELETE' replaced by 'del'
 */
module.exports = function safeVerb(verb) {
  verb = verb.toLowerCase();
  return (verb === 'delete' ? 'del' : verb);
};
