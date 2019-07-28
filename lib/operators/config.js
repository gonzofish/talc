const fs = require('fs');

const files = require('../utils/files.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');

  return {
    dateFormat: getConfigValue('dateFormat', userConfig, 'YYYY-MM-dd HH:mm:ss'),
    index: getConfigValue('index', userConfig, null),
    input: getConfigValue('input', userConfig),
    output: getConfigValue('output', userConfig),
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

module.exports = load;
