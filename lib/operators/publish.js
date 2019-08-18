const path = require('path');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');

const publish = (filename, { drafts, published }) => {
  const markdownFilename = getMarkdownFilename(filename);
  const draftFilepath = path.join(drafts, markdownFilename);
  const draftContents = filesUtil.readFile(draftFilepath);
  const metadataEnd = getMetadataEnd(draftContents);

  if (metadataEnd !== -1) {
    filesUtil.writeFiles(published, [
      {
        contents: getPublishContents(draftContents, metadataEnd),
        filename: markdownFilename,
      },
    ]);
    filesUtil.deleteFile(draftFilepath);
  }
};

const getMarkdownFilename = (filename) => {
  const extension = path.extname(filename);
  let markdownFilename = filename;

  if (extension !== '.md') {
    markdownFilename = `${filename}.md`;
  }

  return markdownFilename;
};

const getMetadataEnd = (contents) => {
  const DASHES = '---';
  const startIndex = contents.indexOf(DASHES);
  let endIndex = -1;

  if (startIndex !== -1) {
    endIndex = contents.slice(startIndex + DASHES.length).indexOf(DASHES);
  }

  return endIndex === -1 ? -1 : endIndex + DASHES.length;
};

const getPublishContents = (draftContents, metadataEnd) => {
  const publishDate = datesUtil.getCurrent();

  return (
    draftContents.slice(0, metadataEnd) +
    `publish_date: ${publishDate}\n` +
    draftContents.slice(metadataEnd)
  );
};

module.exports = publish;
