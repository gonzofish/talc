const test = require('ava').default;
const sinon = require('sinon');

const filesUtil = require('../../lib/utils/files.util');
const update = require('../../lib/operators/update');
const { mockDate }  = require('../test-utils');

test('should copy a published file to the updating directory when starting an update', (t) => {
  const sandbox = sinon.createSandbox();
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');
  const config = {
    drafts: 'drafts',
    published: 'published',
    updating: 'updating',
  };
  const publishedContents = `---
  title: This is My Post
  create_date: 2004-01-21 23:30:00
  publish_date: 2010-03-27 16:30:00
  ---

  We are family
      `;

  readFile.returns(publishedContents);

  update('start', 'pubbed', config);

  t.true(readFile.calledOnceWith('published/pubbed.md'));
  t.true(writeFiles.calledOnceWith('updating', [
    {
      contents: publishedContents,
      filename: 'pubbed.md'
    }
  ]));

  sandbox.restore();
});

test('should not start updating if the provided file is not published', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    published: 'published',
  };
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');

  readFile.returns();

  update('start', 'doesnt-exist', config);

  t.true(readFile.calledOnceWith('published/doesnt-exist.md'));
  t.false(writeFiles.called);

  sandbox.restore();
});

test('should not start updating if no filename is provided', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    published: 'published',
  };
  const readFile = sandbox.stub(filesUtil, 'readFile');

  update('start', '       ', config);
  update('start', undefined, config);
  update('start', null, config);
  update('start', false, config);

  t.false(readFile.called);

  sandbox.restore();
});

test('should copy a file from updating to published with an updated date when finishing an update and remove the file from updating', (t) => {
  const sandbox = sinon.createSandbox();
  const deleteFile = sandbox.stub(filesUtil, 'deleteFile');
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');
  const clock = mockDate('2022-10-17 00:00:00');
  const config = {
    drafts: 'drafts',
    published: 'published',
    updating: 'updating',
  };
  const updatingContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
publish_date: 2010-03-27 16:30:00
---

We are family

UPDATE: another bay-beeeee?
    `;
  const publishedContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
publish_date: 2010-03-27 16:30:00
update_date: 2022-10-17 00:00:00
---

We are family

UPDATE: another bay-beeeee?
    `;

  readFile.returns(updatingContents);

  update('finish', 'up-date', config);

  t.true(readFile.calledOnceWith('updating/up-date.md'));
  t.true(writeFiles.calledOnceWith('published', [
    {
      contents: publishedContents,
      filename: 'up-date.md'
    }
  ]));
  t.true(deleteFile.calledOnceWith('updating/up-date.md'));

  clock.restore();
  sandbox.restore();
});

test('should overwrite a previous update_date value if present', (t) => {
  const sandbox = sinon.createSandbox();
  const deleteFile = sandbox.stub(filesUtil, 'deleteFile');
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');
  const clock = mockDate('2022-10-17 00:00:00');
  const config = {
    drafts: 'drafts',
    published: 'published',
    updating: 'updating',
  };
  const updatingContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
publish_date: 2010-03-27 16:30:00
update_date: 2017-11-13 00:00:00
---

We are family

UPDATE: another bay-beeeee?
    `;
  const publishedContents = `---
title: This is My Post
create_date: 2004-01-21 23:30:00
publish_date: 2010-03-27 16:30:00
update_date: 2022-10-17 00:00:00
---

We are family

UPDATE: another bay-beeeee?
    `;

  readFile.returns(updatingContents);

  update('finish', 'up-date', config);

  t.true(readFile.calledOnceWith('updating/up-date.md'));
  t.true(writeFiles.calledOnceWith('published', [
    {
      contents: publishedContents,
      filename: 'up-date.md'
    }
  ]));
  t.true(deleteFile.calledOnceWith('updating/up-date.md'));

  clock.restore();
  sandbox.restore();
});

test('should do nothing if the update file has no contents', (t) => {
  const sandbox = sinon.createSandbox();
  const readFile = sandbox.stub(filesUtil, 'readFile');
  const writeFiles = sandbox.stub(filesUtil, 'writeFiles');
  const config = { updating: 'updating' };

  readFile.returns();

  update('finish', 'not-there', config);

  t.true(readFile.called);
  t.false(writeFiles.called);

  sandbox.restore();
});

test('should throw an error for an unknown action', (t) => {
  const error = t.throws(() => (
    update('some-bad-action')
  ), { instanceOf: Error })

  t.is(
    error.message,
    '"some-bad-action" is not a known update action. Known update actions are:\n' +
    '\t* start\n' +
    '\t* finish\n\n'
  )
})
