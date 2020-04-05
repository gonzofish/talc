const test = require('ava').default;
const sinon = require('sinon');

const files = require('../../lib/utils/files.util');
const load = require('../../lib/utils/config.util');

let sandbox = sinon.createSandbox();
let userConfig;

test.before(() => {
  sandbox.stub(files, 'findRoot').returns('/root');
  sandbox.stub(files, 'requireFile').callsFake(() => userConfig);
});

test.after(() => {
  sandbox.restore();
});

test('should look for a config file next to the nearest package.json', (t) => {
  userConfig = {
    built: 'output',
    dateFormat: 'M/d/yyyy',
    drafts: 'drafts',
    pages: {
      directory: 'talc',
      templates: [
        {
          template: 'my-index.html',
          type: 'listing',
        },
        {
          template: 'my-post.html',
          type: 'post',
        },
      ],
    },
    published: 'input',
    sortBy: ['title'],
  };

  t.deepEqual(load(), userConfig);
});

test('should use a default config if one is not present', (t) => {
  userConfig = undefined;
  t.deepEqual(load(), {
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    drafts: 'drafts',
    pages: {
      templates: [],
    },
    published: 'published',
    sortBy: ['publish_date'],
  });
});

test('should use a partial config', (t) => {
  userConfig = {
    drafts: 'unpublished',
    published: 'pizza',
  };

  t.deepEqual(load(), {
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    drafts: 'unpublished',
    pages: {
      templates: [],
    },
    published: 'pizza',
    sortBy: ['publish_date'],
  });
});

test('should throw an error if the `dateFormat` value is not a valid Luxon format', (t) => {
  userConfig = {
    dateFormat: '!@@##',
  };

  t.throws(
    () => load(),
    Error,
    'The `dateFormat` configuration attribute must be a valid Luxon format',
  );
});

test('should throw an error if `pages` is not an object', (t) => {
  userConfig = {
    pages: () => {},
  };

  t.throws(
    () => load(),
    Error,
    'The `pages` configuration attribute must be an object',
  );
});

test('should throw an error if `pages` does not have a `templates` array', (t) => {
  userConfig = {
    pages: {},
  };

  t.throws(
    () => load(),
    Error,
    'The `pages` configuration attribute must have a `templates` array',
  );
});

test('should throw an error if the `sortBy` value is NOT an array', (t) => {
  userConfig = {
    sortBy: 'banana',
  };

  t.throws(
    () => load(),
    TypeError,
    'The `sortBy` configuration attribute must be an Array of Strings',
  );
});
