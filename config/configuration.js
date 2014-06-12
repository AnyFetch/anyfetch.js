'use strict';

module.exports = {
  // Mapping descriptors from JSON files
  defaultDescriptor: require('../config/json/default-descriptor.json'),
  apiDescriptors: require('../config/json/api-descriptors.json'),
  aliases: require('../config/json/aliases.json'),

  apiHost: process.env.API_HOST || 'https://api.anyfetch.com',

  // Warning: the USERNAME env variable can be used by the OS
  test: {
    port: process.env.PORT || '50000',
    login: process.env.LOGIN,
    password: process.env.PASSWORD
  }
};