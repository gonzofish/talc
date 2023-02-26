const fs = require('fs');
const os = require('os');
const path = require('path');

const deleteFile = (filepath) => {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

const ensureExt = (filename, extension) => {
  const dotExtension = extension[0] === '.' ? extension : `.${extension}`;
  const fileExtension = path.extname(filename);
  let withExt = filename;

  if (fileExtension !== dotExtension) {
    withExt = `${filename}${dotExtension}`;
  }

  return withExt;
};

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

  /* istanbul ignore next */
  if (os.platform === 'win32') {
    systemRoot = process.cwd().split(path.sep)[0];
  }

  return systemRoot;
};

/* istanbul ignore next */
const loadModule = (moduleName, onLoad, onError) => {
  try {
    const loaded = require(moduleName);

    onLoad(loaded);
  } catch (_) {
    onError(moduleName);
  }
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
        contents: readFile(path.join(dir, filename)),
        filename,
      });
    }
  }

  return files;
};

const readFile = (filepath) => {
  let contents;

  if (filepath && fs.existsSync(filepath)) {
    contents = fs.readFileSync(filepath, {
      encoding: 'utf8',
    });
  }

  return contents;
};

const writeFiles = (dir, files) => {
  const haveContents = [];

  for (const file of files) {
    const contents = file.contents && file.contents.trim();

    if (contents) {
      const filepath = path.join(dir, file.filename);

      ensureDirpath(filepath);

      haveContents.push({
        contents,
        filepath,
      });
    }
  }

  if (haveContents.length > 0) {
    ensureDirs([dir]);
  }

  for (const { contents, filepath } of haveContents) {
    fs.writeFileSync(filepath, contents, { encoding: 'utf8' });
  }
};

const copyFiles = (destDir, files, transformFilename) => {
  let transform = (filename) => filename;

  if (typeof transformFilename === 'function') {
    transform = transformFilename;
  }

  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new ReferenceError(`Could not copy over the asset named "${file}"`);
    }
    const dest = path.join(destDir, transform(file));

    ensureDirpath(dest);
    fs.copyFileSync(file, dest);
  }
};

const ensureDirpath = (filepath) => {
  const parts = filepath.split(path.sep);

  /* istanbul ignore else */
  if (parts.length > 1) {
    ensureDirs(parts.slice(0, -1));
  }
};

const ensureDirs = (dirs) => {
  let currentDir = '';

  for (const dir of dirs) {
    currentDir = path.join(currentDir, dir);
    ensureDir(currentDir);
  }
};

const ensureDir = (dir) => {
  try {
    fs.statSync(dir);
  } catch (e) {
    fs.mkdirSync(dir);
  }
};

const checkIsDir = (dir) => {
  let isDir = true;

  try {
    const stats = fs.statSync(dir);

    isDir = stats.isDirectory();
  } catch (e) {
    isDir = false;
  }

  return isDir;
};

const updateMetadata = (original, updates) => {
  const { content, metadata } = splitContent(original);
  const withUpdates = applyMetadataUpdates(metadata, updates);

  return withUpdates
    ? `---\n${withUpdates}\n---\n${content.replace(/^\n/, '')}`
    : content;
};

const splitContent = (original) => {
  const matches = original.match(/^---(.+)---(.+)/s);
  let content = original;
  let metadata = '';

  if (matches) {
    metadata = matches[1];
    content = matches[2];
  }

  return {
    content,
    metadata,
  };
};

const applyMetadataUpdates = (metadata, updates) => {
  const lines = metadata.split('\n').filter(Boolean);
  const remaining = { ...updates };
  const updated = [];

  const addUpdate = (attribute, value) => {
    const trimmedValue = `${value}`.trim();

    if (trimmedValue) {
      updated.push(`${attribute}: ${trimmedValue}`);
    }
  };

  for (const line of lines) {
    const firstColon = line.indexOf(':');
    const attribute = line.slice(0, firstColon).trim();
    const value = line.slice(firstColon + 1).trim();
    let nextValue = value;

    if (remaining[attribute]) {
      nextValue = remaining[attribute];
      delete remaining[attribute];
    }

    addUpdate(attribute, nextValue);
  }

  for (const [attribute, value] of Object.entries(remaining)) {
    addUpdate(attribute, value);
  }

  return updated.join('\n');
};

module.exports = {
  checkIsDir,
  copyFiles,
  deleteFile,
  ensureExt,
  findRoot,
  loadModule,
  readFile,
  readFiles,
  requireFile,
  writeFiles,
  updateMetadata,
};
