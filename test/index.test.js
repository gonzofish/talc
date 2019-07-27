const test = require('ava').default;
const sinon = require('sinon');

const operators = require('../lib/operators');
const run = require('../lib');
const config = {
  input: 'posts-md',
  output: 'posts-html',
};

const setup = () => {
  const sandbox = sinon.createSandbox();

  sandbox.stub(operators, 'loadConfig').returns(config);

  return sandbox;
};

test('should delegate a "new" command to the generator', (t) => {
  const sandbox = setup();
  const generate = sandbox.stub(operators, 'generateMarkdown');

  run('new', 'This is My Title');

  t.true(generate.calledWith('This is My Title', config));

  sandbox.restore();
});

test('should delegate a "build" command to the convertor', (t) => {
  const sandbox = setup();
  const convert = sandbox.stub(operators, 'convert');

  run('build');

  t.true(convert.calledWith(config));

  sandbox.restore();
});
