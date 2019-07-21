const test = require('ava').default;
const sinon = require('sinon');

const operators = require('../lib/operators');
const run = require('../lib');

test('should delegate a "new" command', (t) => {
  const config = {
    input: {
      dir: 'posts-md',
      nameFormat: '[date]-[name]',
    },
    output: {
      dir: 'posts-html',
      nameFormat: '[date]-[name]',
    },
  };
  const sandbox = sinon.createSandbox();
  const generate = sandbox.stub(operators, 'generateMarkdown');

  sandbox.stub(operators, 'loadConfig').returns(config);

  run('new', 'This is My Title');

  t.true(generate.calledWith('This is My Title', config));

  sandbox.restore();
});
