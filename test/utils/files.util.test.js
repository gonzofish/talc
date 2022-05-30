const test = require('ava').default;
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const files = require('../../lib/utils/files.util');

const setupReadFiles = () => {
  const sandbox = sinon.createSandbox();
  const realRead = fs.readFileSync;
  const fakeFiles = {
    'myfake/path/alpha.txt': 'this is my text',
    'myfake/path/bravo.txt': 'cool beans\nbud',
    'myfake/path/pizza.md': '# A Markdown Header',
  };

  sandbox.stub(fs, 'existsSync').callsFake((filepath) => (
    !!fakeFiles[filepath]
  ));
  sandbox
    .stub(fs, 'readdirSync')
    .returns(['alpha.txt', 'bravo.txt', 'pizza.md']);
  sandbox.stub(fs, 'readFileSync').callsFake((filepath, ...args) => {
    if (filepath.startsWith('myfake/path' + path.sep)) {
      return fakeFiles[filepath];
    }

    return realRead(filepath, ...args);
  });

  return sandbox;
};

test('#ensureExt should add the provided extension if it is not already on the filename', (t) => {
  t.true(files.ensureExt('pizza-party', 'js') === 'pizza-party.js');
  t.true(files.ensureExt('pizza-party', '.js') === 'pizza-party.js');
  t.true(files.ensureExt('pizza-party.js', 'js') === 'pizza-party.js');
  t.true(files.ensureExt('pizza-party.md', 'js') === 'pizza-party.md.js');
});

test('#findRoot should find the nearest directory with a package.json', (t) => {
  const projRoot = process.cwd();

  t.is(files.findRoot(), projRoot);

  process.chdir(path.join(projRoot, 'test'));

  t.is(files.findRoot(), projRoot);

  process.chdir(projRoot);
});

test('#findRoot should just return undefined if it reaches the system root', (t) => {
  t.is(files.findRoot('/'), undefined);
});

test('#readFile should return undefined if a file does not exist', (t) => {
  t.is(files.readFile('myfake/path/fakefile.md'), undefined);
});

test('#readFiles should return the files listed in a specified directory', (t) => {
  const sandbox = setupReadFiles();

  t.deepEqual(files.readFiles('myfake/path'), [
    {
      contents: 'this is my text',
      filename: 'alpha.txt',
    },
    {
      contents: 'cool beans\nbud',
      filename: 'bravo.txt',
    },
    {
      contents: '# A Markdown Header',
      filename: 'pizza.md',
    },
  ]);

  sandbox.restore();
});

test('#readFiles should return files of a specified extension', (t) => {
  const sandbox = setupReadFiles();

  t.deepEqual(files.readFiles('myfake/path', 'md'), [
    {
      contents: '# A Markdown Header',
      filename: 'pizza.md',
    },
  ]);

  t.deepEqual(files.readFiles('myfake/path', 'txt'), [
    {
      contents: 'this is my text',
      filename: 'alpha.txt',
    },
    {
      contents: 'cool beans\nbud',
      filename: 'bravo.txt',
    },
  ]);

  t.deepEqual(files.readFiles('myfake/path', 'exe'), []);

  sandbox.restore();
});

test('#writeFiles should write a list of files to a directory', (t) => {
  const sandbox = sinon.createSandbox();
  const writeFile = sandbox.stub(fs, 'writeFileSync');
  const dir = 'some/dir';

  sandbox.stub(fs, 'existsSync').returns(true);

  files.writeFiles(dir, [
    {
      contents: '# Here is My Header\n\nThis is some content\n\nSO is this',
      filename: 'file_a.md',
    },
    {
      contents: 'A plain text file',
      filename: 'plain.txt',
    },
    {
      contents: '         \n\n   \n  ',
      filename: 'empty.txt',
    },
  ]);

  t.is(writeFile.callCount, 2);
  t.deepEqual(writeFile.firstCall.args, [
    `${dir}${path.sep}file_a.md`,
    '# Here is My Header\n\nThis is some content\n\nSO is this',
    { encoding: 'utf8' },
  ]);
  t.deepEqual(writeFile.secondCall.args, [
    `${dir}${path.sep}plain.txt`,
    'A plain text file',
    { encoding: 'utf8' },
  ]);

  sandbox.restore();
});

test('#writeFiles should create the directory if it does not exist', (t) => {
  const sandbox = sinon.createSandbox();
  const mkdir = sandbox.stub(fs, 'mkdirSync');
  const dir = 'missing/folder';

  sandbox.stub(fs, 'writeFileSync');
  sandbox.stub(fs, 'existsSync').returns(false);

  files.writeFiles(dir, [
    {
      contents: 'Write me',
      filename: 'write.txt',
    },
  ]);

  t.true(mkdir.calledWith(dir));

  sandbox.restore();
});

test('#writeFiles should NOT create the directory if no files have contents', (t) => {
  const sandbox = sinon.createSandbox();
  const mkdir = sandbox.stub(fs, 'mkdirSync');
  const writeFile = sandbox.stub(fs, 'writeFileSync');

  sandbox.stub(fs, 'existsSync').returns(false);

  files.writeFiles('wontmatter', [
    {
      contents: null,
      filename: 'write.txt',
    },
  ]);

  t.true(mkdir.notCalled);
  t.true(writeFile.notCalled);

  sandbox.restore();
});

test('#deleteFile should remove the specified filepath', (t) => {
  const sandbox = sinon.createSandbox();
  const exists = sandbox.stub(fs, 'existsSync');
  const unlink = sandbox.stub(fs, 'unlinkSync');

  exists.returns(true);
  files.deleteFile('this/is/my/file.txt');

  t.true(exists.calledOnceWith('this/is/my/file.txt'));
  t.true(unlink.calledOnceWith('this/is/my/file.txt'));

  sandbox.restore();
});

test('#deleteFile should do nothing if the file does not exist', (t) => {
  const sandbox = sinon.createSandbox();
  const exists = sandbox.stub(fs, 'existsSync');
  const unlink = sandbox.stub(fs, 'unlinkSync');

  exists.returns(false);
  files.deleteFile('this/is-not-a-file.txt');

  t.true(exists.calledOnceWith('this/is-not-a-file.txt'));
  t.true(unlink.notCalled);

  sandbox.restore();
});

test('#updateMetadata should add updates as metadata to the front of the content', (t) => {
  const content = `# Header

Here is some text!

* Item 1
* Item 2
* Item 3`;
  const withHeader = `---
alpha: 1
beta: banana
gamma: false
---
${content}`;
  const updates = {
    alpha: 1,
    beta: 'banana',
    gamma: false,
  };

  t.is(files.updateMetadata(content, updates), withHeader);
});

test('#updateMetadata should not add a metadata section if there are no updates', (t) => {
  const content = `# Header

Here is some text!

* Item 1
* Item 2
* Item 3`;
  const updates = {
    alpha: '',
    beta: '     ',
  };

  t.is(files.updateMetadata(content, updates), content);
});

test('#updateMetadata should overwrite previous metadata with updates', (t) => {
  const content = `# Header

Here is some text!

* Item 1
* Item 2
* Item 3`;
  const original = `---
alpha: 1
beta: banana
gamma: false
delta: apple
---
${content}`;
  const updated = `---
alpha: 2
beta: banana
gamma: true
delta: apple
zeta: apple
---
${content}`;
  const updates = {
    alpha: 2,
    beta: 'banana',
    gamma: true,
    zeta: 'apple',
  };

  t.is(files.updateMetadata(original, updates), updated);
});
