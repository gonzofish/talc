const { DateTime } = require('luxon');

const files = require('./files.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');
  const config = {
    built: getConfigValue('built', userConfig),
    dateFormat: getConfigValue('dateFormat', userConfig, 'yyyy-MM-dd HH:mm:ss'),
    drafts: getConfigValue('drafts', userConfig),
    index: getConfigValue('index', userConfig, null),
    published: getConfigValue('published', userConfig),
    sortBy: getConfigValue('sortBy', userConfig, ['publish_date']),
    template: getConfigValue('template', userConfig, null),
  };

  checkTypes(config);

  return config;
};

const getConfigValue = (dir, userConfig, defaultValue) => {
  let value = defaultValue === undefined ? dir : defaultValue;

  if (userConfig && userConfig[dir]) {
    value = userConfig[dir];
  }

  return value;
};

const checkTypes = (config) => {
  checkDateFormat(config.dateFormat);
  checkSortType(config.sortBy);
};

const checkDateFormat = (dateFormat) => {
  if (DateTime.local().toFormat(dateFormat) === dateFormat) {
    throw Error(
      'The `dateFormat` configuration attribute must be a vlaid Luxon format',
    );
  }
};

const checkSortType = (sortBy) => {
  const checkItemTypes = () =>
    sortBy.findIndex((item) => typeof item !== 'string');

  if (!Array.isArray(sortBy) || !checkItemTypes()) {
    throw TypeError(
      'The `sortBy` configuration attribute must be an Array of Strings',
    );
  }
};

// This makes it so we can mock `load`
// in tests
module.exports = (...args) => module.exports.loadConfig(...args);
module.exports.loadConfig = load;
