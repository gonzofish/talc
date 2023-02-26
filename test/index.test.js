const test = require('ava').default;
const sinon = require('sinon');

const operators = require('../lib/operators');
const loadConfig = require('../lib/utils/config.util');
const run = require('../lib');

const setup = () => {
  const sandbox = sinon.createSandbox();
  const config = {
    input: 'posts-md',
    output: 'posts-html',
    plugins: [
      {
        commands: ['zap', 'z'],
        name: 'zapper',
        run: sinon.stub(),
        type: 'command',
      },
      {
        commands: ['tap', 't'],
        name: 'taps',
        run: sinon.stub(),
        type: 'command',
      },
    ],
  };

  sandbox.mock();
  sandbox.stub(loadConfig, 'loadConfig').returns(config);

  return { config, sandbox };
};

test('should delegate a "new" command to the generator', (t) => {
  const { config, sandbox } = setup();
  const generate = sandbox.stub(operators, 'generateMarkdown');

  run('new', 'This is My Title');

  t.true(generate.calledWith('This is My Title', config));

  sandbox.restore();
});

test('should alias "new" with "n"', (t) => {
  const { config, sandbox } = setup();
  const generate = sandbox.stub(operators, 'generateMarkdown');

  run('n', 'Aliased new');

  t.true(generate.calledWith('Aliased new', config));

  sandbox.restore();
});

test('should delegate a "build" command to the convertor', (t) => {
  const { config, sandbox } = setup();
  const convert = sandbox.stub(operators, 'convert');

  run('build');

  t.true(convert.calledWith(config));

  sandbox.restore();
});

test('should alias "build" with "b"', (t) => {
  const { config, sandbox } = setup();
  const convert = sandbox.stub(operators, 'convert');

  run('b');

  t.true(convert.calledWith(config));

  sandbox.restore();
});

test('should delegate a "publish" command to the publish operator', (t) => {
  const { config, sandbox } = setup();
  const publish = sandbox.stub(operators, 'publish');

  run('publish', 'my-file');

  t.true(publish.calledWith('my-file', config));

  sandbox.restore();
});

test('should alias "publish" with "p"', (t) => {
  const { config, sandbox } = setup();
  const publish = sandbox.stub(operators, 'publish');

  run('p', 'aliased');

  t.true(publish.calledWith('aliased', config));

  sandbox.restore();
});

test('should delegate an "update" command to the update operator', (t) => {
  const { config, sandbox } = setup();
  const update = sandbox.stub(operators, 'update');

  run('update', 'start', 'my-file');

  t.true(update.calledWith('start', 'my-file', config));

  sandbox.restore();
});

test('should alias "update" with "u"', (t) => {
  const { config, sandbox } = setup();
  const update = sandbox.stub(operators, 'update');

  run('u', 'finish', 'my-file');

  t.true(update.calledWith('finish', 'my-file', config));

  sandbox.restore();
});

test('should run a plugin command', (t) => {
  const { config, sandbox } = setup();

  run('tap', true, 'blue', 12);

  t.true(config.plugins[1].run.calledWith(true, 'blue', 12, config));

  sandbox.restore();
});
