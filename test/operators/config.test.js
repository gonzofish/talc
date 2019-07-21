const test = require('ava').default;
const sinon = require('sinon');

const files = require('../../lib/utils/files.util');
const load = require('../../lib/operators/config');

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
    input: {
      dir: 'posts',
      nameFormat: '[date] [title]',
    },
    output: {
      dir: 'published',
      nameFormat: '[title] [date]',
    },
  };

  t.deepEqual(load(), userConfig);
});

test('should use a default config if one is not present', (t) => {
  userConfig = undefined;
  t.deepEqual(load(), {
    input: {
      dir: 'input',
      nameFormat: '[date]_[title]',
    },
    output: {
      dir: 'output',
      nameFormat: '[date]_[title]',
    },
  });
});

test('should use a partial config', (t) => {
  userConfig = {
    input: {
      dir: 'pizza',
    },
    output: {
      nameFormat: '[date]',
    },
  };

  t.deepEqual(load(), {
    input: {
      dir: 'pizza',
      nameFormat: '[date]_[title]',
    },
    output: {
      dir: 'output',
      nameFormat: '[date]',
    },
  });
});
