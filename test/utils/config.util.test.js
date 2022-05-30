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
    updating: 'rework'
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
    updating: 'updating',
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
    updating: 'updating',
  });
});

test('should throw an error if the `dateFormat` value is not a valid date format', (t) => {
  userConfig = {
    dateFormat: '!@@##',
  };

  const error = t.throws(() => load(), { instanceOf: Error });
  t.is(
    error.message,
    'The `dateFormat` configuration attribute must be a valid date format.\n' +
    'Please see https://date-fns.org/docs/format for more information'
  );
});

test('should throw an error if `pages` is not an object', (t) => {
  userConfig = {
    pages: () => {},
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(error.message, 'The `pages` configuration attribute must be an object');
});

test('should throw an error if a provided `pages.directory` is not a string', (t) => {
  userConfig = {
    pages: {
      directory: 123,
      templates: [],
    },
  };
  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'The `directory` attribute of the `pages` configuration attribute must be a string',
  );
});

test('should throw an error if `pages` does not have a `templates` array', (t) => {
  userConfig = {
    pages: {},
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'The `pages` configuration attribute must have a `templates` array',
  );
});

test('should throw an error if a `pages` template is not an object', (t) => {
  userConfig = {
    pages: {
      templates: [123],
    },
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'Each item in the `templates` array of the `pages` configuration attribute must be an object',
  );
});

test('should throw an error if a `pages` template is missing a `file` attribute', (t) => {
  userConfig = {
    pages: {
      templates: [{ file: '123' }, {}],
    },
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'Each item in the `templates` array of the `pages` configuration attribute must have a `template` attribute',
  );
});

test("should throw an error if a `pages` template's `sortBy` attribute is NOT an array", (t) => {
  userConfig = {
    pages: {
      templates: [
        {
          sortBy: 'banana',
          template: 'good.html',
        },
      ],
    },
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an array of strings',
  );
});

test("should throw an error if a `pages` template's `sortBy` attribute is NOT an array of strings", (t) => {
  userConfig = {
    pages: {
      templates: [
        {
          sortBy: [123],
          template: 'good.html',
        },
      ],
    },
  };

  const error = t.throws(() => load(), { instanceOf: TypeError });
  t.is(
    error.message,
    'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an array of strings',
  );
});
