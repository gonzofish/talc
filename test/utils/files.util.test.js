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

  sandbox.stub(fs, 'existsSync').returns(true);
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

test('#findRoot should find the nearest directory with a package.json', (t) => {
  const projRoot = process.cwd();

  t.is(files.findRoot(), projRoot);

  process.chdir(path.join(projRoot, 'test'));

  t.is(files.findRoot(), projRoot);

  process.chdir(projRoot);
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
