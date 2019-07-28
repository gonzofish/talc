const cheerio = require('cheerio');
const { DateTime } = require('luxon');
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
      html = addToTemplate(template, metadata, html, config);
    }

    return {
      contents: html,
      filename: `${filename}.html`,
      metadata,
    };
  });

  filesUtil.writeFiles(config.output, htmlFiles);
};

const addToTemplate = (template, metadata, contents, config) => {
  const $ = cheerio.load(template);
  const replacementAreas = $('*')
    .contents()
    .filter(
      (index, element) =>
        element.type === 'comment' && element.data.trim().startsWith('talc:'),
    );
  let update = template;

  if (replacementAreas) {
    replacementAreas.replaceWith((index, element) => {
      const variable = element.data.trim().replace('talc:', '');

      if (variable === 'content') {
        return contents;
      } else if (metadata[variable]) {
        return formatKnownVariable(metadata[variable], variable, config);
      }

      return element;
    });
    update = $.html();
  }

  return update;
};

const formatKnownVariable = (value, variable, config) => {
  switch (variable) {
    case 'create_date':
    case 'publish_date':
      return formatDate(value, config.dateFormat);
    default:
      return value;
  }
};

const formatDate = (value, dateFormat) => {
  let formatted = value;

  if (dateFormat !== 'YYYY-MM-dd HH:mm:ss') {
    formatted = DateTime.fromJSDate(new Date(value)).toFormat(dateFormat);
  }

  return formatted;
};

module.exports = convert;
