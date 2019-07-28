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
    dateFormat: 'M/d/yyyy',
    index: 'my-index.html',
    input: 'posts',
    output: 'published',
    template: 'my-template.html',
  };

  t.deepEqual(load(), userConfig);
});

test('should use a default config if one is not present', (t) => {
  userConfig = undefined;
  t.deepEqual(load(), {
    dateFormat: 'YYYY-MM-dd HH:mm:ss',
    index: null,
    input: 'input',
    output: 'output',
    template: null,
  });
});

test('should use a partial config', (t) => {
  userConfig = {
    input: 'pizza',
  };

  t.deepEqual(load(), {
    dateFormat: 'YYYY-MM-dd HH:mm:ss',
    index: null,
    input: 'pizza',
    output: 'output',
    template: null,
  });
});
