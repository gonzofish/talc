const showdown = require('showdown');

const filesUtil = require('../utils/files.util');

const convert = (config) => {
  const converter = new showdown.Converter();
  const files = filesUtil.readFiles(config.input, 'md');
  const htmlFiles = files.map(({ contents, filename }) => ({
    contents: converter.makeHtml(contents),
    filename: filename.replace(/\.md$/, '.html'),
  }));

  filesUtil.writeFiles(config.output, htmlFiles);
};

module.exports = convert;
