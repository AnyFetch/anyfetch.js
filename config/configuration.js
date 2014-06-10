'use strict';

module.exports = {
  // Mapping descriptors from JSON files
  defaultDescriptor: require('../config/json/default-descriptor.json'),
  apiDescriptors: require('../config/json/api-descriptors.json'),
  aliases: require('../config/json/aliases.json'),
  documentRelatedEndpoints: require('../config/json/document-related-endpoints.json'),

  apiHost: 'https://api.anyfetch.com'
};