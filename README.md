Cluestr Library
=====================
> You'll only be interested in this package if you want to create an hydrater / provider for [Cluestr](http://cluestr.com).

> In most cases, you'll find [Cluestr Hydrater](https://github.com/Papiel/cluestr-file-hydrater) and [Cluestr Provider](https://github.com/Papiel/cluestr-provider) more high level, and more easy to work with.

This npm package makes communicating with Cluestr servers easy for providers and hydraters.

Please note: Cluestr delivers long lived `access_token`, so you don't need to use a `refresh_token`.

Example use
-----------

### Trade authorization code
Create a client, then call `getAccessToken()` with the code and a callback. Callback will takes two parameters: the error if any, then the access token.

```javascript
var Cluestr = require('cluestr');

// Get your id and secret key on
// http://cluestr.com/oauth/applications
var CLUESTR_ID = "your_cluestr_id"
var CLUESTR_SECRET = "your_cluestr_secret"

// Your authorization code
var code = req.params.code

var cluestr = new Cluestr(CLUESTR_ID, CLUESTR_SECRET);

cluestr.getAccessToken(code, function(err, accessToken) {
  if(err) {
    throw err;
  }

  console.log("Your access_token: ", accessToken)
});
```

### Send a document
Create a client, then call `setAccessToken()` with some access_token. Then, call `sendDocument()` with an object hash containing the document (need to have at least an identifier key, everything else follows the rules defined in Cluestr API) and a callback (first parameter is the error if any, then the document).

```javascript
var Cluestr = require('cluestr');

// Get your id and secret key on
// http://cluestr.com/oauth/applications
var CLUESTR_ID = "your_cluestr_id"
var CLUESTR_SECRET = "your_cluestr_secret"

// Your access_token
var accessToken = getAccessTokenFromDb()

var cluestr = new Cluestr(CLUESTR_ID, CLUESTR_SECRET);

cluestr.setAccessToken(accessToken);

// Document to be sent to Cluestr.
var document = {
  'identifier': 'http://unique-document-identifier',
  'metadatas': {
    'foo': 'bar',
    'hello': ['world']
  }
}

cluestr.sendDocument(document, function(err, document) {
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
var Cluestr = require('cluestr');

var CLUESTR_ID = "your_cluestr_id"
var CLUESTR_SECRET = "your_cluestr_secret"
var accessToken = getAccessTokenFromDb()
var cluestr = new Cluestr(CLUESTR_ID, CLUESTR_SECRET);
cluestr.setAccessToken(accessToken);

// Send a document to Cluestr
var document = {
  'identifier': 'http://unique-document-identifier',
  'metadatas': {
    'foo': 'bar',
    'hello': ['world']
  }
}
cluestr.sendDocument(document, function(err, document) {
  var fileConfig = {
    file: fs.createReadStream('/path/to/file'),
    filename: 'name_of_file.png',
  };
  cluestr.sendFile(document.identifier, fileConfig, function(err) {
    if(err) {
      throw err;
    }
  });
});
```

### Remove a document
```javascript
var Cluestr = require('cluestr');

// Get your id and secret key on
// http://cluestr.com/oauth/applications
var CLUESTR_ID = "your_cluestr_id"
var CLUESTR_SECRET = "your_cluestr_secret"

// Your access_token
var accessToken = getAccessTokenFromDb()

var cluestr = new Cluestr(CLUESTR_ID, CLUESTR_SECRET);

cluestr.setAccessToken(accessToken);

var identifier = 'http://unique-document-identifier';

cluestr.deleteDocument(identifier, function(err) {
  if(err) {
    throw err;
  }

  console.log("Document successfully deleted.")
});
```

### Send a document and a file
Combine `sendDocument()` and `sendFile()`.
Call `sendDocumentAndFile()` with an object hash defining the document, an object hash defining the file and a final callback (first parameter is the error if any, second parameter is the document).

## Helper functions

### `debug.createTestFrontServer()`
Create a mock server for your test, to trade authorization grants.
Will always return an `access_token` with value `fake_access_token`.
Use with `process.env.CLUESTR_FRONT`, for instance:

```javascript
var CluestrClient = require('cluestr);
process.env.CLUESTR_FRONT = 'http://localhost:1337';

// Create a fake HTTP server
var frontServer = CluestrClient.debug.createTestFrontServer();
frontServer.listen(1337);
```

You can enable debug mode by specifying `true` as first parameter.

### `debug.createTestApiServer`
Create a mock server for your test, to upload documents and file.
Will provide `/providers/document` (post and delete) and `/providers/document/file`.
Use with `process.env.CLUESTR_SERVER`, for instance:

```javascript
var CluestrClient = require('cluestr');
process.env.CLUESTR_SERVER = 'http://localhost:1338';

// Create a fake HTTP server
var frontServer = CluestrClient.debug.createTestApiServer();
frontServer.listen(1338);
```

You can enable debug mode by specifying `true` as first parameter.
