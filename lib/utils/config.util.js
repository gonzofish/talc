const { DateTime } = require('luxon');

const files = require('./files.util');
const { checkIsType, TYPES } = require('./types.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');
  const config = {
    built: getConfigValue('built', userConfig),
    dateFormat: getConfigValue('dateFormat', userConfig, 'yyyy-MM-dd HH:mm:ss'),
    drafts: getConfigValue('drafts', userConfig),
    pages: getConfigValue('pages', userConfig, { templates: [] }),
    published: getConfigValue('published', userConfig),
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
  checkPagesStructure(config.pages);
};

const checkDateFormat = (dateFormat) => {
  if (DateTime.local().toFormat(dateFormat) === dateFormat) {
    throw Error(
      'The `dateFormat` configuration attribute must be a valid Luxon format',
    );
  }
};

const checkPagesStructure = (pages) => {
  if (!checkIsType(pages, TYPES.OBJECT)) {
    throw TypeError('The `pages` configuration attribute must be an object');
  }

  if (pages.directory && !checkIsType(pages.directory, TYPES.STRING)) {
    throw TypeError(
      'The `directory` attribute of the `pages` configuration attribute must be a string',
    );
  }

  if (!Array.isArray(pages.templates)) {
    throw TypeError(
      'The `pages` configuration attribute must have a `templates` array',
    );
  }

  for (const template of pages.templates) {
    if (!checkIsType(template, TYPES.OBJECT)) {
      throw TypeError(
        'Each item in the `templates` array of the `pages` configuration attribute must be an object',
      );
    }

    if (!checkIsType(template.template, TYPES.STRING)) {
      throw TypeError(
        'Each item in the `templates` array of the `pages` configuration attribute must have a `template` attribute',
      );
    }

    if (template.sortBy) {
      checkSortType(template.sortBy);
    }
  }
};

const checkSortType = (sortBy) => {
  const checkItemTypes = () =>
    sortBy.findIndex((item) => typeof item !== 'string');

  if (!Array.isArray(sortBy) || !checkItemTypes()) {
    throw TypeError(
      'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an Array of Strings',
    );
  }
};

// This makes it so we can mock `load`
// in tests
module.exports = (...args) => module.exports.loadConfig(...args);
module.exports.loadConfig = load;
