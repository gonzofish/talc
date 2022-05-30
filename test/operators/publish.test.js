const test = require('ava').default;
const sinon = require('sinon');

const publish = require('../../lib/operators/publish');
const datesUtil = require('../../lib/utils/dates.util');
const filesUtil = require('../../lib/utils/files.util');

test('should move the specified file from drafts to published and add publish_date metadata', (t) => {
  const config = {
    drafts: 'drafts',
    published: 'published',
  };
  const draftContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
---

We are family
    `;
  const publishedContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
publish_date: 2010-03-27 16:30:00
---

We are family
    `;
  const sandbox = sinon.createSandbox();
  const deleteFile = sandbox.stub(filesUtil, 'deleteFile');
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');

  sandbox.stub(datesUtil, 'getCurrent').returns('2010-03-27 16:30:00');
  readFile.returns(draftContents);

  publish('my-draft', config);

  t.true(readFile.calledOnceWith('drafts/my-draft.md'));
  t.true(
    writeFiles.calledOnceWith('published', [
      {
        contents: publishedContents,
        filename: 'my-draft.md',
      },
    ]),
  );
  t.true(deleteFile.calledOnceWith('drafts/my-draft.md'));

  sandbox.restore();
});

test('should be able to handle a file argument with an md extension', (t) => {
  const config = {
    drafts: 'drafts',
    published: 'published',
  };
  const sandbox = sinon.createSandbox();
  const readFile = sandbox.stub(filesUtil, 'readFile');

  readFile.returns('');

  publish('pizza.md', config);

  t.true(readFile.calledOnceWith('drafts/pizza.md'));

  sandbox.restore();
});
