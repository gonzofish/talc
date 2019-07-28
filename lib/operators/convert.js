const cheerio = require('cheerio');
const showdown = require('showdown');

const filesUtil = require('../utils/files.util');

const convert = (config) => {
  const template = filesUtil.readFile(config.template);
  const converter = new showdown.Converter({ metadata: true });
  const files = filesUtil.readFiles(config.input, 'md');
  const htmlFiles = files.map(({ contents }) => {
    let html = converter.makeHtml(contents);
    const metadata = converter.getMetadata();
    const filename = metadata.title.toLowerCase().replace(/[^0-9a-z]+/g, '-');

    if (template) {
      html = addToTemplate(template, html);
    }

    return {
      contents: html,
      filename: `${filename}.html`,
    };
  });

  filesUtil.writeFiles(config.output, htmlFiles);
};

const addToTemplate = (template, contents) => {
  const $ = cheerio.load(template);
  const contentArea = $('*')
    .contents()
    .filter(
      (index, element) =>
        element.type === 'comment' && element.data.trim() === 'talc-content',
    );
  let update = template;

  if (contentArea) {
    contentArea.replaceWith(contents);
    update = $.html();
  }

  return update;
};

module.exports = convert;
