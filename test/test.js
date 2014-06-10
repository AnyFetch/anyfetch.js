'use strict';
var fs = require('fs');
var m = require('./index.js');

var cb = function(err, res) {
  console.log(err);
  if (res) {
    console.log(res.req._header);
    console.log(res.body);
    console.log('-----------------');
  }
};

m.getStatus(cb);

m.getDocumentById(123, cb);
m.getDocumentById('aze', cb); // Should fail

m.getDocumentById(123).getRelated(cb);
m.getDocumentById('aze').getRelated(cb); // Should fail

m.getDocumentByIdentifier('aze').getRaw(cb);

var stream = fs.createReadStream('config/json/aliases.json');
m.getDocumentByIdentifier('aze').postFile({
  file: stream
}, cb);