Cluestr Library
=====================
> You'll only be interested in this package if you want to create an hydrater / provider for [Cluestr](http://cluestr.com).

> In most cases, you'll find [Cluestr Hydrater](https://github.com/Papiel/cluestr-file-hydrater) and [Cluestr Provider](https://github.com/Papiel/cluestr-provider) more high level, and more easy to work with.

This npm package makes communicating with Cluestr servers easy for providers and hydraters.

Please note: Cluestr delivers long lived `access_token`, so you don't need to use a `refresh_token`.

Example use
-----------

### Trade authorization code
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
```javascript
var Cluestr = require('cluestr-oauth');

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

cluestr.sendDocument(document, function(err, accessToken) {
  if(err) {
    throw err;
  }

  console.log("Document successfully saved.")
});
```

### Remove a document
```javascript
var Cluestr = require('cluestr-oauth');

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
