const test = require('ava').default;
const fs = require('fs');
const path = require('path');

const files = require('../../lib/utils/files.util');

test('#findRoot should find the nearest directory with a package.json', (t) => {
  const projRoot = process.cwd();

  t.is(files.findRoot(), projRoot);

  process.chdir(path.join(projRoot, 'test'));

  t.is(files.findRoot(), projRoot);

  process.chdir(projRoot);
});
