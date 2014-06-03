var Anyfetch = require('anyfetch');

// Oauth flow
Anyfetch.getAccessToken(APP_ID, APP_SECRET, code, function(err, accessToken) {
	var client = new Anyfetch(accessToken);
	// OR
	var client = new Anyfetch(login, password);

	client.getCompany(cb);
	client.getToken(cb);

	client.updateCompany(cbErr);
	client.resetCompany(cbErr);

	client.getSubcompanies(cb)
	client.addSubcompany(user, subcompany, cb)
	client.deleteSubcompany(subcompanyId, cb)

	client.getDocuments(filters, cb)
});

