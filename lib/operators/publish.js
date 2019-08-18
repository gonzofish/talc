const path = require('path');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');

const publish = (filename, { drafts, published }) => {
  const markdownFilename = getMarkdownFilename(filename);
  const draftFilepath = path.join(drafts, markdownFilename);
  const draftContents = filesUtil.readFile(draftFilepath);
  const metadataEnd = getMetadataEnd(draftContents);
  const publishDate = datesUtil.getCurrent();
  const publishedContents =
    draftContents.slice(0, metadataEnd) +
    `publish_date: ${publishDate}\n` +
    draftContents.slice(metadataEnd);

  filesUtil.writeFiles(published, [
    {
      contents: publishedContents,
      filename: markdownFilename,
    },
  ]);
  filesUtil.deleteFile(draftFilepath);
};

const getMarkdownFilename = (filename) => `${filename}.md`;
const getMetadataEnd = (contents) => {
  const DASHES = '---';
  const start = contents.indexOf(DASHES) + DASHES.length;

  return contents.slice(start).indexOf(DASHES) + DASHES.length;
};

module.exports = publish;
