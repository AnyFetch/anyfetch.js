'use strict';

var regex = /^[0-9a-f]{24}$/i;
module.exports = function isMongoId(id) {
  return !!id.toString().match(regex);
};
