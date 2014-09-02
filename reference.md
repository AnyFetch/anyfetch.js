Mappings
========
These functions are the easiest way to request the AnyFetch API. Each function corresponds directly to an endpoint: **please see the [full API reference](http://developers.anyfetch.com/endpoints/)**.

Most callbacks are expected to be of the form: `function cb(err, res)`, where `res` is a [SuperAgent Response object](http://visionmedia.github.io/superagent/#response-properties) directly representing the reponse obtained from the API.
## Mapping functions ordered by API endpoint

### `/` endpoint

**`getIndex(cb)`**

### `/batch` endpoint

**`getBatch([params], cb)`**:

- Arguments:
  - `params` (object): will be passed as GET parameters.
  Supported keys: `pages`

### `/company` endpoint

**`getCompany(cb)`**

### `/company/reset` endpoint

**`deleteCompanyReset(cb)`**

### `/company/update` endpoint

**`postCompanyUpdate(cb)`**

### `/document_types` endpoint

**`getDocumentTypes(cb)`**

### `/documents` endpoint

**`getDocuments([params], cb)`**:

- Arguments:
  - `params` (object): will be passed as GET parameters.
  Supported keys: `id`, `search`, `before`, `after`, `document_type`, `token`, `_meta`, `has_meta`, `snippet_size`, `start`, `sort`, `limit`, `strict`

**`postDocument([body], cb)`**:

- Arguments:
  - `body` (object): will be sent as the request's body (POST).
  Supported keys: `identifier`, `creation_date`, `document_type`, `last_modification`, `actions`, `data`, `metadata`, `related`, `user_access`

### `/documents/identifier/{identifier}` endpoint

**`getDocumentByIdentifier(identifier, [params], cb)`**:

- Arguments:
  - `identifier` (string): the custom identifier set for your document
  - `params` (object): will be passed as GET parameters.
  Supported keys: `search`, `snippet_size`

- **Subfunctions**:
  - **`getDocumentByIdentifier(id).getSimilar(identifier, [params], cb)`**:
    
    - Arguments:
      - `identifier` (string): the custom identifier set for your document
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentByIdentifier(id).getRelated(identifier, [params], cb)`**:
    
    - Arguments:
      - `identifier` (string): the custom identifier set for your document
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentByIdentifier(id).getRaw(identifier, [params], cb)`**:
    
    - Arguments:
      - `identifier` (string): the custom identifier set for your document
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentByIdentifier(id).getFile(identifier, [params], cb)`**:
    
    - Arguments:
      - `identifier` (string): the custom identifier set for your document
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
**`deleteDocumentByIdentifier(identifier, cb)`**:

- Arguments:
  - `identifier` (string): the custom identifier set for your document

### `/documents/{id}` endpoint

**`getDocumentById(id, [params], cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId
  - `params` (object): will be passed as GET parameters.
  Supported keys: `search`, `snippet_size`

- **Subfunctions**:
  - **`getDocumentById(id).getSimilar(id, [params], cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentById(id).getRelated(id, [params], cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentById(id).getRaw(id, [params], cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
  - **`getDocumentById(id).getFile(id, [params], cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
      - `params` (object): will be passed as GET parameters.
      Supported keys: `search`, `snippet_size`
    
**`patchDocumentById(id, [body], cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId
  - `body` (object): will be sent as the request's body (POST).
  Supported keys: `identifier`, `document_type`, `actions`, `data`, `metadata`, `related`, `user_access`

**`deleteDocumentById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

### `/providers` endpoint

**`getProviders(cb)`**

### `/providers/{id}` endpoint

**`getProviderById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

**`deleteProviderById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

- **Subfunctions**:
  - **`deleteProviderById(id).deleteReset(id, cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
    
### `/status` endpoint

**`getStatus(cb)`**

### `/subcompanies` endpoint

**`getSubcompanies(cb)`**

**`postSubcompany([body], cb)`**:

- Arguments:
  - `body` (object): will be sent as the request's body (POST).
  Supported keys: `user`, `name`, `hydraters`

### `/subcompanies/{id}` endpoint

**`getSubcompanyById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

- **Subfunctions**:
  - **`getSubcompanyById(id).deleteReset(id, cb)`**:
    
    - Arguments:
      - `id` (string): a valid MongoDB ObjectId
    
**`deleteSubcompanyById(id, [params], cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId
  - `params` (object): will be passed as GET parameters.
  Supported keys: `force`

### `/token` endpoint

**`getToken(cb)`**

**`deleteToken(cb)`**

### `/users` endpoint

**`getUsers(cb)`**

**`postUser([body], cb)`**:

- Arguments:
  - `body` (object): will be sent as the request's body (POST).
  Supported keys: `email`, `name`, `password`, `is_admin`

### `/users/{id}` endpoint

**`getUserById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

**`patchUserById(id, [body], cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId
  - `body` (object): will be sent as the request's body (POST).
  Supported keys: `email`, `name`, `password`, `is_admin`

**`deleteUserById(id, cb)`**:

- Arguments:
  - `id` (string): a valid MongoDB ObjectId

