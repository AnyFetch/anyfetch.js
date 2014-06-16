anyFetch api wrapper for Node.js
================================
[![Build Status](https://travis-ci.org/AnyFetch/anyfetch.js.png?branch=master)](https://travis-ci.org/AnyFetch/anyfetch.js)
[![Dependency Status](https://gemnasium.com/AnyFetch/anyfetch.js.png)](https://gemnasium.com/AnyFetch/anyfetch.js)
[![Coverage Status](https://coveralls.io/repos/AnyFetch/anyfetch.js/badge.png?branch=master)](https://coveralls.io/r/AnyFetch/anyfetch.js?branch=master)
[![NPM version](https://badge.fury.io/js/anyfetch.png)](http://badge.fury.io/js/anyfetch)


> You'll only be interested in this package if you want to create a client applications for [anyFetch](http://anyFetch.com).

> In most cases, you'll find [anyFetch Hydrater Library](https://github.com/AnyFetch/anyfetch-hydratation.js) and [anyFetch Provider Library](https://github.com/AnyFetch/anyfetch-provider.js) more high level, and more easy to work with.

This npm package makes communicating with anyFetch servers easy for clients, providers and hydraters.

Please note: anyFetch delivers long lived `access_token`, so you don't need to use a `refresh_token`.

Example use
-----------

### Trade authorization code
Create a client, then call `getAccessToken()` with the code and a callback. Callback will takes two parameters: the error if any, then the access token.

```javascript
var AnyFetch = require('anyfetch');

// Get your id and secret key on
// http://manager.anyfetch.com/clients/new
var ANYFETCH_ID = "your_anyfetch_id";
var ANYFETCH_SECRET = "your_anyfetch_secret";

// Your authorization code
var code = req.params.code;

var afclient = new AnyFetch(ANYFETCH_ID, ANYFETCH_SECRET);

afclient.getAccessToken(code, function(err, accessToken) {
  if(err) {
    throw err;
  }

  console.log("Your access_token: ", accessToken)
});
```

### Send a document
Create a client, then call `setAccessToken()` with some access_token. Then, call `sendDocument()` with an object hash containing the document (need to have at least an identifier key, everything else follows the rules defined in anyFetch API) and a callback (first parameter is the error if any, then the document).

```javascript
var AnyFetch = require('anyfetch');

// Get your id and secret key on
// http://manager.anyfetch.com/clients/new
var ANYFETCH_ID = "your_anyfetch_id";
var ANYFETCH_SECRET = "your_anyfetch_secret";

// Your authorization code
var code = req.params.code;

var afclient = new AnyFetch(ANYFETCH_ID, ANYFETCH_SECRET);

afclient.setAccessToken(token);

// Document to be sent to anyFetch.
var document = {
  'identifier': 'http://unique-document-identifier',
  'metadata': {
    'foo': 'bar',
    'hello': ['world']
  }
}

afclient.sendDocument(document, function(err, document) {
  if(err) {
    throw err;
  }

  console.log("Document successfully saved.")
});
```

### Send a file
Create a client, then call `setAccessToken()` with some access_token. Then, call `sendDocument()` as defined above.
Then, you can call `sendFile()` with an object hash containing the file (needs to have at least a file key, which can be a stream or a buffer. When using home-made streams, you also need to specify a knownLength attribute with the stream size in bytes) and a callback function (first parameter is the error if any).

```javascript
var fs = require('fs');
var AnyFetch = require('anyfetch');

// Get your id and secret key on
// http://manager.anyfetch.com/clients/new
var ANYFETCH_ID = "your_anyfetch_id";
var ANYFETCH_SECRET = "your_anyfetch_secret";

// Your authorization code
var code = req.params.code;

var afclient = new AnyFetch(ANYFETCH_ID, ANYFETCH_SECRET);

afclient.setAccessToken(token);

// Send a document to anyFetch
var document = {
  'identifier': 'http://unique-document-identifier',
  'metadata': {
    'foo': 'bar',
    'hello': ['world']
  }
}
afclient.sendDocument(document, function(err, document) {
  var fileConfig = function() {
    // Wrap this in a function to avoid creating the stream before reading it.
    return {
      file: fs.createReadStream('/path/to/file'),
      filename: 'name_of_file.png',
    };
  };
  anyFetch.sendFile(document.identifier, fileConfig, function(err) {
    if(err) {
      throw err;
    }
  });
});
```

### Remove a document
```javascript
var AnyFetch = require('anyfetch');

// Get your id and secret key on
// http://manager.anyfetch.com/clients/new
var ANYFETCH_ID = "your_anyfetch_id";
var ANYFETCH_SECRET = "your_anyfetch_secret";

// Your authorization code
var code = req.params.code;

var afclient = new AnyFetch(ANYFETCH_ID, ANYFETCH_SECRET);

afclient.setAccessToken(token);

var identifier = 'http://unique-document-identifier';

afclient.deleteDocument(identifier, function(err) {
  if(err) {
    throw err;
  }

  console.log("Document successfully deleted.")
});
```

### Send a document and a file
Combine `sendDocument()` and `sendFile()`.
Call `sendDocumentAndFile()` with an object hash defining the document, an object hash defining the file and a final callback (first parameter is the error if any, second parameter is the document).

> If you use this, keep in mind you need to wrap the creation of the file object in a function. This function will be called when needed. Without the function, any stream you create will start sending data before being listened to.

## Helper functions

### `debug.createTestFrontServer(debugFunction)`
Create a mock server for your test, to trade authorization grants.
Will always return an `access_token` with value `fake_access_token`.
Use with `process.env.ANYFETCH_MANAGER_URL`, for instance:

```javascript
var AnyFetch = require('anyfetch');
process.env.ANYFETCH_MANAGER_URL = 'http://localhost:1337';

// Create a fake HTTP server
var frontServer = AnyFetch.debug.createTestFrontServer();
frontServer.listen(1337);
```

You can enable debug mode by specifying `true` as first parameter (will use `console.log`) or sending a custom logging function.

### `debug.createTestApiServer(debugFunction)`
Create a mock server for your test, to upload documents and file.
Will provide `/providers/document` (post and delete) and `/providers/document/file`.
Use with `process.env.ANYFETCH_API_URL`, for instance:

```javascript
var AnyFetch = require('anyfetch');
process.env.ANYFETCH_API_URL = 'http://localhost:1338';

// Create a fake HTTP server
var frontServer = AnyFetch.debug.createTestApiServer();
frontServer.listen(1338);
```

You can enable debug mode by specifying `true` as first parameter (will use `console.log`) or sending a custom logging function.
