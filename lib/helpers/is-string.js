'use strict';

module.exports = function isString(value) {
  return (typeof value === 'string') || (value instanceof String);
};
