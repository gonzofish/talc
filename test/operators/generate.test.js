const test = require('ava').default;
const fs = require('fs');
const sinon = require('sinon');

const generate = require('../../lib/operators/generate');

test.before(() => {
  const myDate = new Date('2018-08-03 00:00:00');
  const now = myDate.valueOf();

  sinon.useFakeTimers({ now });
});

test.after(() => {
  sinon.restore();
});

test('should create a file using the config options', (t) => {
  const config = {
    input: {
      dir: 'my_posts',
      nameFormat: '[date]-[title]',
    },
  };
  const filename = 'my_posts/2018-08-03-my-first-post.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');

  generate('My First Post', config);

  t.true(writeFile.calledWith(filename));

  sandbox.restore();
});

test('should handle a trailing literal', (t) => {
  const config = {
    input: {
      dir: 'my_posts',
      nameFormat: '[date]-[title]__post',
    },
  };
  const filename = 'my_posts/2018-08-03-my-first-entry__post.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');

  generate('My First Entry', config);

  t.true(writeFile.calledWith(filename));

  sandbox.restore();
});

test('should ignore unknown variables', (t) => {
  const config = {
    input: {
      dir: 'my_posts',
      nameFormat: '[date]-[title]-[pizza]',
    },
  };
  const filename = 'my_posts/2018-08-03-my-first-entry-.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');

  generate('My First Entry', config);

  t.true(writeFile.calledWith(filename));

  sandbox.restore();
});
