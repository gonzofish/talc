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

const readFiles = (dir, ext) => {
  const filenames = fs.readdirSync(dir);
  const files = [];

  for (const filename of filenames) {
    if (!ext || path.extname(filename) === `.${ext}`) {
      files.push({
        contents: fs.readFileSync(path.join(dir, filename)),
        filename,
      });
    }
  }

  return files;
};

const writeFiles = (dir, files) => {
  const haveContents = [];

  for (const file of files) {
    const contents = file.contents && file.contents.trim();

    if (contents) {
      haveContents.push({
        contents,
        filepath: path.join(dir, file.filename),
      });
    }
  }

  if (haveContents.length > 0 && !fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  for (const { contents, filepath } of haveContents) {
    fs.writeFileSync(filepath, contents, { encoding: 'utf8' });
  }
};

module.exports = {
  findRoot,
  readFiles,
  requireFile,
  writeFiles,
};
