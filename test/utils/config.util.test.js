const test = require('ava').default;
const sinon = require('sinon');

const files = require('../../lib/utils/files.util');
const load = require('../../lib/utils/config.util');

let sandbox = sinon.createSandbox();
let userConfig;

test.before(() => {
  sandbox.stub(files, 'checkIsDir').returns(true);
  sandbox.stub(files, 'findRoot').returns('/root');
  sandbox.stub(files, 'requireFile').callsFake(() => userConfig);
  sandbox.stub(files, 'loadModule').callsFake((_, onLoad) => {
    onLoad({});
  });
});

test.after(() => {
  sandbox.restore();
});

test('should look for a config file next to the nearest package.json', (t) => {
  userConfig = {
    assets: '',
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
    plugins: [],
    published: 'input',
    updating: 'rework',
  };

  t.deepEqual(load(), userConfig);
});

test('should use a default config if one is not present', (t) => {
  userConfig = undefined;
  t.deepEqual(load(), {
    assets: '',
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    drafts: 'drafts',
    pages: {
      templates: [],
    },
    plugins: [],
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
    assets: '',
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    drafts: 'unpublished',
    pages: {
      templates: [],
    },
    plugins: [],
    published: 'pizza',
    updating: 'updating',
  });
});

test('should load any plugins', (t) => {
  const run = () => {};

  userConfig = {
    plugins: ['my-cool-plugin', 'found-plugin'],
  };

  files.loadModule.callsFake((moduleName, onLoad) => {
    return onLoad(moduleName, {
      name: moduleName,
      run,
      type: 'command',
    });
  });

  t.deepEqual(load().plugins, [
    {
      name: 'my-cool-plugin',
      run,
      type: 'command',
    },
    {
      name: 'found-plugin',
      run,
      type: 'command',
    },
  ]);
});

test('should throw an error if the `assets` value is not a string', (t) => {
  userConfig = { assets: 123 };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message: 'The `assets` configuration attribute must be a string',
  });
});

test('should throw an error if the `assets` is not a valid path', (t) => {
  userConfig = { assets: 'abc/132' };

  files.checkIsDir.returns(false);

  t.throws(() => load(), {
    instanceOf: ReferenceError,
    message:
      'The `assets` configuration attribute must be to a valid directory',
  });

  // return the stub to always validate the
  files.checkIsDir.returns(true);
});

test('should NOT throw an error if the `assets` value is an empty string', (t) => {
  t.plan(0);
  userConfig = undefined;
  files.checkIsDir.returns(false);

  load();

  files.checkIsDir.returns(true);
});

test('should throw an error if the `dateFormat` value is not a valid date format', (t) => {
  userConfig = {
    dateFormat: '!@@##',
  };

  t.throws(() => load(), {
    instanceOf: Error,
    message:
      'The `dateFormat` configuration attribute must be a valid date format.\n' +
      'Please see https://date-fns.org/docs/format for more information',
  });
});

test('should throw an error if `pages` is not an object', (t) => {
  userConfig = {
    pages: () => {},
  };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message: 'The `pages` configuration attribute must be an object',
  });
});

test('should throw an error if a provided `pages.directory` is not a string', (t) => {
  userConfig = {
    pages: {
      directory: 123,
      templates: [],
    },
  };
  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'The `directory` attribute of the `pages` configuration attribute must be a string',
  });
});

test('should throw an error if `pages` does not have a `templates` array', (t) => {
  userConfig = {
    pages: {},
  };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'The `pages` configuration attribute must have a `templates` array',
  });
});

test('should throw an error if a `pages` template is not an object', (t) => {
  userConfig = {
    pages: {
      templates: [123],
    },
  };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'Each item in the `templates` array of the `pages` configuration attribute must be an object',
  });
});

test('should throw an error if a `pages` template is missing a `file` attribute', (t) => {
  userConfig = {
    pages: {
      templates: [{ file: '123' }, {}],
    },
  };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'Each item in the `templates` array of the `pages` configuration attribute must have a `template` attribute',
  });
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

  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an array of strings',
  });
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

  t.throws(() => load(), {
    instanceOf: TypeError,
    message:
      'The `sortBy` attribute of a `templates` item in the `pages` configuration attribute must be an array of strings',
  });
});

test('should throw an error if plugins is not an array', (t) => {
  userConfig = {
    plugins: 'boop',
  };

  t.throws(() => load(), {
    instanceOf: TypeError,
    message: 'The `plugins` attribute must be an array of package names',
  });
});

test('should throw an error if a plugin cannot be found', (t) => {
  userConfig = {
    plugins: [
      'my-cool-plugin',
      'missing-plugin',
      'found-plugin',
      'another-missing-plugin',
    ],
  };

  files.loadModule.callsFake((moduleName, onLoad, onError) => {
    if (
      moduleName === 'missing-plugin' ||
      moduleName === 'another-missing-plugin'
    ) {
      return onError(moduleName);
    }

    return onLoad(moduleName, {});
  });

  t.throws(() => load(), {
    instanceOf: ReferenceError,
    message:
      'The following plugins could not be found: "missing-plugin", "another-missing-plugin"',
  });
});
