const fs = require('fs');

const files = require('./files.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');

  return {
    built: getConfigValue('built', userConfig),
    dateFormat: getConfigValue('dateFormat', userConfig, 'YYYY-MM-dd HH:mm:ss'),
    drafts: getConfigValue('drafts', userConfig),
    index: getConfigValue('index', userConfig, null),
    published: getConfigValue('published', userConfig),
    template: getConfigValue('template', userConfig, null),
  };
};

const getConfigValue = (dir, userConfig, defaultValue) => {
  let value = defaultValue === undefined ? dir : defaultValue;

  if (userConfig && userConfig[dir]) {
    value = userConfig[dir];
  }

  return value;
};

// This makes it so we can mock `load`
// in tests
module.exports = (...args) => module.exports.loadConfig(...args);
module.exports.loadConfig = load;
