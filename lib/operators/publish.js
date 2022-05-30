const path = require('path');

const dates = require('../utils/dates.util');
const files = require('../utils/files.util');

const publish = (filename, { drafts, published }) => {
  const markdownFilename = files.ensureExt(filename, 'md');
  const draftFilepath = path.join(drafts, markdownFilename);
  const draftContents = files.readFile(draftFilepath);

  if (draftContents) {
    files.writeFiles(published, [
      {
        contents: getPublishContents(draftContents),
        filename: markdownFilename,
      },
    ]);
    files.deleteFile(draftFilepath);
  }
};

const getPublishContents = (draftContents) => {
  const publishDate = dates.getCurrent();

  return files.updateMetadata(draftContents, {
    'publish_date': publishDate
  });
};

module.exports = publish;
