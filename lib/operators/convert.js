const showdown = require('showdown');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');

const convert = (config) => {
  const template = filesUtil.readFile(config.template);
  const tree = parseTemplate(template);

  const converter = new showdown.Converter({ metadata: true });
  const files = filesUtil.readFiles(config.published, 'md');
  const htmlFiles = files.map(({ contents }) => {
    let html = converter.makeHtml(contents);
    const metadata = formatMetadata(converter.getMetadata(), config);
    const filename = metadata.title.toLowerCase().replace(/[^0-9a-z]+/g, '-');

    if (tree) {
      html = filterBlankLines(reconstruct(tree, metadata, html));
    }

    return {
      contents: html,
      filename: `${filename}.html`,
      metadata,
    };
  });

  if (config.index) {
    const indexTemplate = filesUtil.readFile(config.index);
    const indexTree = parseTemplate(indexTemplate);
    const fileMetadata = htmlFiles.map(({ filename, metadata }) => ({
      ...metadata,
      filename,
    }));

    htmlFiles.push({
      contents: filterBlankLines(
        reconstruct(indexTree, { files: fileMetadata }),
      ),
      filename: 'index.html',
    });
  }

  filesUtil.writeFiles(config.built, htmlFiles);
};

const parseTemplate = (template) => {
  let subTemplate = template;
  let parent = null;
  let previous = null;
  let node = null;
  let firstNode = null;

  const createNode = (type, content) => {
    node = {
      content,
      parent,
      next: null,
      previous,
      type,
    };

    if (previous) {
      previous.next = node;
    }

    if (node.parent && node.parent.content && !node.parent.content.child) {
      node.parent.content.child = node;
    }

    previous = node;

    if (!firstNode) {
      firstNode = node;
    }
  };

  while (subTemplate) {
    const start = subTemplate.match(/<!--\s*talc:for:([^\s-]+)\s*-->/);
    const end = subTemplate.match(/<!--\s*talc:endfor\s*-->/);

    if (checkStartFirst(start, end)) {
      if (start.index > 0) {
        createNode('text', subTemplate.slice(0, start.index));
      }

      createNode('for', {
        child: null,
        variable: start[1],
      });
      parent = node;
      previous = null;

      subTemplate = subTemplate.slice(start.index + start[0].length);
    } else if (checkEndFirst(start, end)) {
      createNode('text', subTemplate.slice(0, end.index));

      node = node.parent;
      previous = node;
      ({ parent } = node);

      subTemplate = subTemplate.slice(end.index + end[0].length);
    } else {
      createNode('text', subTemplate);
      subTemplate = null;
    }
  }

  return firstNode;
};

const checkStartFirst = (start, end) => start && end && start.index < end.index;

const checkEndFirst = (start, end) =>
  end && (!start || start.index > end.index);

const reconstruct = (tree, metadata, contents) => {
  let content = '';

  if (tree.type === 'text') {
    ({ content } = tree);
  } else if (tree.type === 'for') {
    const { variable } = tree.content;
    const metadataValue =
      metadata[variable] || (isPlainObject(contents) && contents[variable]);

    if (Array.isArray(metadataValue)) {
      for (const value of metadataValue) {
        content += reconstruct(tree.content.child, metadata, value);
      }
    }
  }

  content = replaceVariables(content, metadata, contents);

  if (tree.next) {
    content += reconstruct(tree.next, metadata, contents);
  }

  return content;
};

const replaceVariables = (content, metadata, contents) => {
  const variableRegex = /<!--\s*talc:([a-zA-Z0-9_]+)\s*-->/;
  let replaced = content;
  let talcVar;

  while ((talcVar = variableRegex.exec(replaced))) {
    const variable = talcVar[1].trim();
    let value = '';

    if (variable === 'content') {
      value = contents;
    } else if (metadata[variable]) {
      value = metadata[variable];
    } else if (isPlainObject(contents) && contents[variable]) {
      value = contents[variable];
    }

    replaced =
      replaced.slice(0, talcVar.index) +
      value +
      replaced.slice(talcVar.index + talcVar[0].length);
  }

  return replaced;
};

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const filterBlankLines = (content) =>
  content
    .split(/\n/)
    .filter((line) => line.trim() !== '')
    .concat('')
    .join('\n');

const formatMetadata = (metadata, config) => {
  const formatted = {};

  for (const [variable, value] of Object.entries(metadata)) {
    formatted[variable] = formatKnownVariable(variable, value, config);
  }

  return formatted;
};

const formatKnownVariable = (variable, value, config) => {
  switch (variable) {
    case 'create_date':
    case 'publish_date':
      return datesUtil.format(value, config.dateFormat);
    case 'tags':
      return value.split(',').map((tag) => tag.toLowerCase().trim());
    default:
      return value;
  }
};

module.exports = convert;
