const fs = require('fs');

const files = require('../utils/files.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');

  return {
    input: getConfigValue('input', userConfig),
    output: getConfigValue('output', userConfig),
  };
};

const getConfigValue = (dir, userConfig) => {
  let value = dir;

  if (userConfig && userConfig[dir]) {
    value = userConfig[dir];
  }

  return value;
};

module.exports = load;
