AnyFetch API wrapper for Node.js
================================
[![Build Status](https://travis-ci.org/AnyFetch/anyfetch.js.png?branch=master)](https://travis-ci.org/AnyFetch/anyfetch.js)
[![Dependency Status](https://gemnasium.com/AnyFetch/anyfetch.js.png)](https://gemnasium.com/AnyFetch/anyfetch.js)
[![Coverage Status](https://coveralls.io/repos/AnyFetch/anyfetch.js/badge.png?branch=master)](https://coveralls.io/r/AnyFetch/anyfetch.js?branch=master)
[![NPM version](https://badge.fury.io/js/anyfetch.png)](http://badge.fury.io/js/anyfetch)


> You'll only be interested in this package if you want to create client applications for [AnyFetch](http://anyfetch.com).

> If you're interested in creating a Hydrater or a Provider, you may find [AnyFetch Hydrater Library](https://github.com/AnyFetch/anyfetch-file-hydrater.js) and [AnyFetch Provider Library](https://github.com/AnyFetch/anyfetch-provider.js) more high level, and easier to work with.

This `npm` package makes communicating with the AnyFetch servers easy for clients. Check out the [**full API documentation**](http://developers.anyfetch.com/endpoints/).

## Basic usage example

```js
var AnyFetch = require('anyfetch');

var anyfetchBasic = new AnyFetch('LOGIN', 'PASSWORD');
// OR
var anyfetch = new AnyFetch('TOKEN');

anyfetch.getCurrentUser(function(err, user) {
  console.log('Hello, my name is ' + user.name);
};
```

## Access authentication
> AnyFetch delivers long lived `access_token`, so you don't need to use a `refresh_token`.

Both `Basic` and `Bearer` authentication schemes are supported. The `getToken` method makes it easy to retrieve a token from the user's credentials.
If you're using `Bearer` authentication, the token in use is available in the property `anyfetch.accessToken`.

```js
var Anyfetch = require('anyfetch');

var anyfetchBasic = new Anyfetch('LOGIN', 'PASSWORD');

// Retrieve token from credentials (GET /token)
anyfetchBasic.getToken(function(err, res) {
  if(err) {
    throw err;
  }

  anyfetch = new Anyfetch(res.body.token);
  // We now access the Fetch API using Bearer authentication
  // You can get back the token by accessing `anyfetch.accessToken`
  console.log('We are using the token ' + anyfetch.accessToken);
};
```

## OAuth

The `getAccessToken` static function helps you obtain an `access_token` during the OAuth flow.

```js
Anyfetch.getAccessToken('APP_ID', 'APP_SECRET', 'OAUTH_VERIFICATION_CODE', function(err, accessToken) {
  var anyfetch = new Anyfetch(accessToken);
});
```

## Basic endpoint to function mappings

This library provides a function per [API endpoint](http://developers.anyfetch.com/endpoints/). We adopt the following naming convention:

```js
verbEndpointName(function(error, result) {})
```

Callbacks are expected to be of the form: `function(err, result)`. `result` is a [`Response` object from Superagent](http://visionmedia.github.io/superagent/#response-properties).
Note that some endpoints yield a result with empty body (e.g. `POST /company/update`).

Examples:
- `getUsers(cb)` will call `GET /users`
- `postCompanyUpdate(cb)` will call `POST /company/update`
- `postUser({ email: 'chuck@norris.com' }, cb)`
- `deleteCompanyReset(cb)` will call `DELETE /company/reset`
- `deleteToken(cb)` will call `DELETE /token`

**Example usage**:
```js
var anyfetch = new AnyFetch('TOKEN');
anyfetch.getDocuments({ search: 'John' }, function(err, res) {
  if(err) {
    throw err;
  }
  var docs = res.body;
  console.log('Got these documents:', docs)
});
```

Some functions expect an `id` or `identifier`:

- `getDocumentById(id, cb)` will call `GET /documents/{id}`
- `getDocumentByIdentifier(identifier, cb)` will call `GET /documents/identifier/{identifier}`

Some other endpoints are expressed relative to a document. For example, `GET /documents/{id}/raw` refers to the document with id `{id}`.
For the sake of clarity, we provide the following two-steps call syntax:

- `getDocumentById(id).getSimilar(cb)` will call `GET /documents/{id}/similar`
- `getDocumentById(id).getRaw(cb)` will call `GET /documents/{id}/raw`
- `getDocumentById(id).postFile(config, cb)` will call `POST /documents/{id}/file`

Note that the first function **does not take any callback**. It is simply responsible for building the first part of the request, which is then carried out when calling the sub-function.

A full description of the mapping functions is available in [`api-descriptors.json`](config/json/api-descriptors.json).

### Posting a file associated to a document

The function `getDocumentById(id).postFile(config, cb)` expects a `config` hash containing at least a `file` key from which to obtain the file. It can be a string (path to the file) or a `ReadStream`. It can also contains `contentType` (MIME type) and `filename` keys.

`config` can also be passed as a function. In this case, it is invoked with a callback, which must be called with `(err, config)`.

**Example usage:**
```js
var deliverConfig = function(cb) {
   cb({
      file: fs.createReadStream('path/to/file.png'),
      filename: 'doge.png'
   });
};

getDocumentById(id).postFile(deliverConfig, function(err) {
  // Handle error if any
});
```

## Utility functions
`anyfetch.js` provides higher level utility functions. They cover classic use-cases that would otherwise require several API calls. When possible, calls are grouped in a single batch call.

### Batch request

Make several `GET` calls in a single request. It takes a map associating the endpoint to its parameters.

```js
var pages = {
  '/users': null,
  '/documents': {
    search: 'Marc'
  }
};
anyfetch.batch(pages, function(err, res) {
  // Handle err

  var users = res.body['/users'];
  var documents = res.body['/documents'];
});
```
See [GET /batch](http://developers.anyfetch.com/endpoints/#index-batch-calls) for details.

### Create a subcompany

When [creating a subcompany](http://developers.anyfetch.com/endpoints/#subcompanies-subcompanies-post), we usually want to create its first admin, and migrate it into the new subcompany. The function `createSubcompanyWithAdmin` allows you to do this automatically.
The created user **will be** an admin in the new subcompany.

Your callback is called with `err`, `subcompanies` (info about the newly created company) and `admin` (info about its admin).

```js
var subcompany = {
  name: 'the_fake_subcompany',
  hydraters: [
    'http://plaintext.hydrater.anyfetch.com/hydrate',
    'http://pdf.hydrater.anyfetch.com/hydrate',
  ]
};
var admin = {
  email: 'thechuck@norris.com',
  name: 'Chuck Norris',
  password: 'no_need'
};
anyfetch.createSubcompanyWithAdmin(subcompany, admin, function(err, company, admin) {
  console.log('Company ' + company.id + ' has been created, with ' + admin.id + ' as its admin');
});
```

### Get current user
This function allows you to retrieve the user's info from its credentials (login / password or token).

```js
anyfetch.getCurrentUser(function(err, user) {
  console.log('Hello, my name is ' + user.name);
};
```

### Get document(s) with info

When developping a front-end for the AnyFetch API, it's common to need the `document_type` and `provider` of a particular document. This function allows you to do this in one call.

```js
anyfetch.getDocumentWithInfo(documentId, function(err, doc) {
  console.log('This document is a ' + doc.document_type.name + ' and has been provided by ' + doc.provider.name);
});
```

Related:
- `getDocumentByIdentifierWithInfo(identifier, cb)` is similar but finds the document by its `identifier` instead of its `id`
- `getDocumentsWithInfo(params, cb)` returns the documents matched by the request expressed in `params`

## Manager endpoints

A few endpoints of the AnyFetch Manager are available in `anyfetch.js` for convenience.

- The first example is `getToken(cb)`, [described above](#oauth).

- `getAvailableProviders(trusted, featured, cb)` allows you to obtain a list of all the available providers. The `trusted` and `featured` booleans can be used to restrict the list, but are both optionnal.

- `postAccountName(accountName, cb)` allows you to associate an account name to the access token currently in use. It can only be used with Bearer auth.
  **Example:**

  ```js
  var anyfetch = new AnyFetch('access_token');
  anyfetch.postAccountName(true, 'my_awesome_account_name', function(err, res) {
    console.log('Here are all the trusted providers:');
    console.log(res.body);
  });
  ```

## Overriding target URLs

By default, all methods target the production URLs: [https://api.anyfetch.com](https://api.anyfetch.com) and [https://manager.anyfetch.com](https://manager.anyfetch.com) respectively. There are two ways to override that:

- For **all** instances:

  ```js
  var AnyFetch = require('anyfetch');
  AnyFetch.setApiUrl('http://localhost:3000');
  AnyFetch.setManagerUrl('http://localhost:3000');
  ```
- For one instance only:

  ```js
  var AnyFetch = require('anyfetch');
  var anyfetch = new AnyFetch('TOKEN');
  anyfetch.setApiUrl('http://localhost:3000');
  anyfetch.setManagerUrl('http://localhost:3000');
  ```

It is very useful when writing tests and want to take advantage of the mocking server described below.

## Test framework

`anyfetch.js` provides a ready-to-run mock server based on Restify. It may be useful to test apps that use the AnyFetch API.

The mock server is created with `Anyfetch.createMockServer()` and started with `server.listen(port, cb)`. It is a simple [Restify server](http://mcavage.me/node-restify/).
Once the server is running, override the AnyFetch API url to make it point to your `localhost` with `anyfetch.setApiUrl(url)`. If you're using the OAuth helper method `AnyFetch.getAccessToken`, override the manager URL as well with `AnyFetch.setManagerUrl(url)`. Indeed, the mock server also plays the role of manager.

**Example**: starting the mock server on port 1337
```js
var AnyFetch = require('anyfetch');
var server = Anyfetch.createMockServer();

var port = 1337;
var apiUrl = 'http://localhost:' + port;
server.listen(port, function() {
  console.log('Anyfetch mock server running on ' + apiUrl);
  AnyFetch.setApiUrl(apiUrl);
  AnyFetch.setManagerUrl(apiUrl);

  done();
});
```

### Mocks

The mock server will serve static JSON files from the folder `node_modules/anyfetch/lib/test-server/mocks`. You can tailor them to your need. You can generate those JSON files at any time by:

1. Setting the `LOGIN` and `PASSWORD` environment variables to your Fetch API credentials
2. Running `node node_modules/anyfetch/bin/make-mocks.js`

### Overriding

At any point, you can specify which JSON content to serve for any endpoint using the following methods:

- `server.override(verb, endpoint, json)` to start serving your custom JSON for this endpoint
- `server.restore(verb, endpoint)` to go back to the default built-in response
- `server.restore()` to restore all previously overriden endpoints

Note that these will work even if you try to override an endpoint which does not exist by default. It is useful in testing, for example if you have an odd request to send to a specific route on another API.
