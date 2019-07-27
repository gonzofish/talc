const test = require('ava').default;
const fs = require('fs');
const sinon = require('sinon');

const generate = require('../../lib/operators/generate');
const datesUtil = require('../../lib/utils/dates.util');

test.before(() => {
  sinon.stub(datesUtil, 'getCurrent').returns('2018-08-03 12:34:00');
});

test.after(() => {
  sinon.restore();
});

test('should create a file using the config options', (t) => {
  const config = {
    input: 'my_posts',
  };
  const filename = 'my_posts/my-first-post.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');
  const contents = `---
title: My First Post
created_date: 2018-08-03 12:34:00
---
# My First Post

`;

  sandbox.stub(fs, 'existsSync').returns(true);

  generate('My First Post', config);

  t.true(writeFile.calledWith(filename, contents));

  sandbox.restore();
});

test('should create the input directory if it does not exist', (t) => {
  const config = {
    input: 'my_posts',
  };
  const filename = 'my_posts/my-first-entry.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');
  const mkdir = sandbox.stub(fs, 'mkdirSync');
  const contents = `---
title: My First Entry
created_date: 2018-08-03 12:34:00
---
# My First Entry

`;

  sandbox.stub(fs, 'existsSync').returns(false);

  generate('My First Entry', config);

  t.true(mkdir.calledWith('my_posts'));
  t.true(writeFile.calledWith(filename, contents));

  sandbox.restore();
});
