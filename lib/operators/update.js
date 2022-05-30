const path = require('path');

const dates = require('../utils/dates.util');
const files = require('../utils/files.util');

const update = (action, filename, config) => {
  if (action === 'start') {
    startUpdating(filename, config);
  } else if (action === 'finish') {
    finishUpdating(filename, config);
  } else {
    throw new Error(
      `"${action}" is not a known update action. Known update actions are:\n` +
      '\t* start\n' +
      '\t* finish\n\n'
    );
  }
};

const startUpdating = (filename, { published, updating }) => {
  const trimmedFilename = (filename || '').trim();

  if (!trimmedFilename) {
    return;
  }

  const markdownFilename = files.ensureExt(trimmedFilename, 'md');
  const publishPath = path.join(published, markdownFilename);
  const publishedContents = files.readFile(publishPath);

  if (publishedContents) {
    files.writeFiles(updating, [
      {
        contents: publishedContents,
        filename: markdownFilename,
      }
    ]);
  }
};

const finishUpdating = (filename, { published, updating }) => {
  const markdownFilename = files.ensureExt(filename, 'md');
  const updatingPath = path.join(updating, markdownFilename);
  const updatingContents = files.readFile(updatingPath);

  if (updatingContents) {
    files.writeFiles(published, [
      {
        contents: getUpdatedContents(updatingContents),
        filename: markdownFilename,
      }
    ]);
    files.deleteFile(updatingPath);
  }
};

const getUpdatedContents = (contents) => {
  const updateDate = dates.getCurrent();

  return files.updateMetadata(contents, {
    'update_date': updateDate,
  });
};

module.exports = update;
