const dates = require('./dates.util');
const files = require('./files.util');
const { checkIsType, TYPES } = require('./types.util');

const load = () => {
  const rootDir = files.findRoot();
  const userConfig = files.requireFile(rootDir, 'talc.config.js');
  const config = {
    assets: getConfigValue('assets', userConfig, ''),
    built: getConfigValue('built', userConfig),
    dateFormat: getConfigValue('dateFormat', userConfig, 'yyyy-MM-dd HH:mm:ss'),
    drafts: getConfigValue('drafts', userConfig),
    pages: getConfigValue('pages', userConfig, { templates: [] }),
    plugins: getConfigValue('plugins', userConfig, []),
    published: getConfigValue('published', userConfig),
    updating: getConfigValue('updating', userConfig),
  };

  checkTypes(config);

  config.plugins = loadPlugins(config.plugins);

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
  checkAssetsFormat(config.assets);
  checkDateFormat(config.dateFormat);
  checkPagesStructure(config.pages);
  checkPlugins(config.plugins);
};

const checkAssetsFormat = (assets) => {
  if (!checkIsType(assets, TYPES.STRING)) {
    throw TypeError('The `assets` configuration attribute must be a string');
  }

  if (assets && !files.checkIsDir(assets)) {
    throw ReferenceError(
      'The `assets` configuration attribute must be to a valid directory',
    );
  }
};

const checkDateFormat = (dateFormat) => {
  if (dates.format(new Date(), dateFormat) === dateFormat) {
    throw Error(
      'The `dateFormat` configuration attribute must be a valid date format.\n' +
        'Please see https://date-fns.org/docs/format for more information',
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

  /* istanbul ignore else */
  if (!Array.isArray(sortBy) || !checkItemTypes()) {
    throw TypeError(
      'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an array of strings',
    );
  }
};

const checkPlugins = (plugins) => {
  if (!Array.isArray(plugins)) {
    throw TypeError(
      'The `plugins` attribute must be an array of package names',
    );
  }
};

const loadPlugins = (plugins) => {
  const loaded = [];
  const missing = [];

  for (const plugin of plugins) {
    files.loadModule(
      plugin,
      (_pluginName, pluginConfig) => {
        loaded.push(pluginConfig);
      },
      () => {
        missing.push(plugin);
      },
    );
  }

  if (missing.length) {
    raiseMissingPlugins(missing);
  }

  return loaded;
};

const raiseMissingPlugins = (missing) => {
  const list = missing.map((plugin) => `"${plugin}"`).join(', ');

  throw ReferenceError(`The following plugins could not be found: ${list}`);
};

// This makes it so we can mock `load`
// in tests
module.exports = (...args) => module.exports.loadConfig(...args);
module.exports.loadConfig = load;
