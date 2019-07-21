const fs = require('fs');
const os = require('os');
const path = require('path');

const findRoot = (dir) => {
  const realDir = dir || process.cwd();
  const files = fs.readdirSync(realDir);
  let root;

  if (files.includes('package.json')) {
    root = realDir;
  } else if (!checkIsSystemRoot(realDir)) {
    root = getParentDir(realDir);
  }

  return root;
};

const checkIsSystemRoot = (dir) => dir === getSystemRoot();

const getParentDir = (dir) => {
  const parts = dir.split(path.sep);

  return path.join(getSystemRoot(), ...parts.slice(1, -1));
};

const getSystemRoot = () => {
  let systemRoot = path.sep;

  if (os.platform === 'win32') {
    systemRoot = process.cwd().split(path.sep)[0];
  }

  return systemRoot;
};

/* istanbul ignore next */
const requireFile = (dir, filename) => {
  let filepath = dir;

  if (filename) {
    filepath = path.join(dir, filename);
  }

  return fs.existsSync(filepath) && require(filepath);
};

module.exports = {
  findRoot,
  requireFile,
};