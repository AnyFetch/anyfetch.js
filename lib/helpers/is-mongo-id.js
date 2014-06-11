'use strict';

var regex = /^[0-9a-fA-F]{24}$/;
module.exports = function isMongoId(id) {
  return (regex.match(id) !== null);
};