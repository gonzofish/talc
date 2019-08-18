const test = require('ava').default;
const sinon = require('sinon');

const generate = require('../../lib/operators/generate');
const datesUtil = require('../../lib/utils/dates.util');
const filesUtil = require('../../lib/utils/files.util');

test.before(() => {
  sinon.stub(datesUtil, 'getCurrent').returns('2018-08-03 12:34:00');
});

test.after(() => {
  sinon.restore();
});

test('should create a file using the config options', (t) => {
  const config = {
    drafts: 'my_drafts',
  };
  const filename = 'my_drafts/my-first-post.md';
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(filesUtil, 'writeFiles');
  const contents = `---
title: My First Post
create_date: 2018-08-03 12:34:00
---

`;

  generate('My First Post', config);

  t.true(writeFile.calledWith(filename, [contents]));

  sandbox.restore();
});
