const showdown = require('showdown');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');

const NOOP = () => {};

const convert = (config) => {
  const templates = partitionTemplates(
    config.pages.templates,
    config.pages.directory,
  );

  const converter = new showdown.Converter({ metadata: true });
  const files = filesUtil.readFiles(config.published, 'md');
  const htmlFiles = templates.basic;

  if (templates.post.length === 0) {
    // ensure if no post types that we still
    // produce post files
    templates.post.push(null);
  }

  for (const file of files) {
    const html = converter.makeHtml(file.contents);
    const metadata = formatMetadata(converter.getMetadata(), config);
    const filename = metadata.title.toLowerCase().replace(/[^0-9a-z]+/g, '-');

    for (const template of templates.post) {
      let contents = html;

      if (template && template.tree) {
        contents = filterBlankLines(reconstruct(template.tree, metadata, html));
      }

      htmlFiles.push({
        contents,
        filename: `${filename}.html`,
        metadata,
      });
    }
  }

  for (const template of templates.listing) {
    const sortConfig = {
      dateFormat: config.dateFormat,
      sortBy: template.sortBy || ['publish_date'],
    };
    const sorted = sortFiles(htmlFiles, sortConfig);
    const fileMetadata = sorted.map(({ filename, metadata }) => ({
      ...metadata,
      filename,
    }));
    const transform = template.transformer || transformGeneric;
    const transformed = transform(fileMetadata, template);

    for (const output of transformed) {
      htmlFiles.push({
        contents: filterBlankLines(
          reconstruct(template.tree, { files: output.files }),
        ),
        filename: output.filename || 'index.html',
      });
    }
  }

  filesUtil.writeFiles(config.built, htmlFiles);
};

const transformGeneric = (files, template) => [
  {
    filename: template.filename,
    files,
  },
];

const partitionTemplates = (templates) => {
  const partitions = {
    basic: [],
    listing: [],
    post: [],
  };

  for (const template of templates) {
    const parsed = filesUtil.readFile(template.template);
    const tree = parseTemplate(parsed);
    let type = template.type;

    if (!partitions[type]) {
      type = 'basic';
    }

    if (tree) {
      partitions[type].push({
        ...template,
        tree,
      });
    }
  }

  return partitions;
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

const sortFiles = (files, config) => {
  const { sortBy } = config;

  return files.slice().sort((a, b) => {
    let direction = 0;
    let counter = 0;

    while (direction === 0 && counter < sortBy.length) {
      direction = compareBy(sortBy[0], a.metadata, b.metadata, config);

      counter++;
    }

    return direction;
  });
};

const compareBy = (attribute, a, b, config) => {
  let compare = compareStrings;

  if (attribute === 'publish_date' || attribute === 'create_date') {
    compare = compareDates;
  }

  return compare(a[attribute], b[attribute], config);
};

const compareDates = (a, b, { dateFormat }) => {
  const dateA = datesUtil.toLuxon(a, dateFormat);
  const dateB = datesUtil.toLuxon(b, dateFormat);

  return dateB.toMillis() - dateA.toMillis();
};

const compareStrings = (a, b) => {
  const stringA = ('' + a).toLowerCase();
  const stringB = ('' + b).toLowerCase();
  let direction = 0;

  if (stringA < stringB) {
    direction = -1;
  } else if (stringB < stringA) {
    direction = 1;
  }

  return direction;
};

module.exports = convert;
