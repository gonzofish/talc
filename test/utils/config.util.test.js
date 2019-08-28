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
    index: 'my-index.html',
    published: 'input',
    sortBy: ['title'],
    template: 'my-template.html',
  };

  t.deepEqual(load(), userConfig);
});

test('should use a default config if one is not present', (t) => {
  userConfig = undefined;
  t.deepEqual(load(), {
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    drafts: 'drafts',
    index: null,
    published: 'published',
    sortBy: ['publish_date'],
    template: null,
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
    index: null,
    published: 'pizza',
    sortBy: ['publish_date'],
    template: null,
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
