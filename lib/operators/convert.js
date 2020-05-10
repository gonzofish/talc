const path = require('path');
const showdown = require('showdown');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');
const templatesUtil = require('../utils/templates');

const convert = (config) => {
  const templates = partitionTemplates(
    config.pages.templates,
    config.pages.directory,
  );
  const files = filesUtil.readFiles(config.published, 'md');

  const postFiles = transformPosts(templates.post, files, config);
  const listingFiles = transformListings(templates.listing, postFiles, config);

  filesUtil.writeFiles(
    config.built,
    getUniqueNames(postFiles.concat(listingFiles)),
  );
};

const partitionTemplates = (templates, directory) => {
  const partitions = {
    listing: [],
    post: [],
  };
  const prefix = directory ? `${directory}${path.sep}` : '';
  let templateCache = {};

  for (const template of templates) {
    const { tree, cached } = templatesUtil.parse(
      prefix,
      template.template,
      templateCache,
    );
    let type = template.type;

    templateCache = {
      ...cached,
      ...templateCache,
    };

    if (tree) {
      partitions[type].push({
        ...template,
        tree,
      });
    }
  }

  if (partitions.post.length === 0) {
    // ensure if no post types that we still
    // produce post files
    partitions.post.push(null);
  }

  return partitions;
};

const transformPosts = (templates, files, config) => {
  const converter = new showdown.Converter({ metadata: true });
  const posts = [];

  for (const file of files) {
    const html = converter.makeHtml(file.contents);
    const metadata = formatMetadata(converter.getMetadata(), config);
    const filename = metadata.title.toLowerCase().replace(/[^0-9a-z]+/g, '-');

    for (const template of templates) {
      let contents = html;

      if (template && template.tree) {
        contents = filterBlankLines(
          templatesUtil.reconstruct(template.tree, metadata, html),
        );
      }

      posts.push({
        contents,
        filename: `${filename}.html`,
        metadata,
      });
    }
  }

  return posts;
};

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

const transformListings = (templates, posts, { dateFormat, pages }) => {
  const listings = [];

  for (const template of templates) {
    const sortConfig = {
      dateFormat,
      sortBy: template.sortBy || ['publish_date'],
    };
    const sorted = sortFiles(posts, sortConfig);
    const fileMetadata = sorted.map(({ filename, metadata }) => ({
      ...metadata,
      filename,
    }));
    const transform = template.transformer || transformGeneric;
    const transformed = transform(fileMetadata, template);

    for (const output of transformed) {
      const tree = output.template
        ? getTransformedTemplate(output.template, pages.directory)
        : template.tree;

      listings.push({
        contents: filterBlankLines(
          templatesUtil.reconstruct(tree, {
            ...output.metadata,
            files: output.files,
          }),
        ),
        filename: output.filename || 'index.html',
      });
    }
  }

  return listings;
};

const getTransformedTemplate = (template, directory) => {
  const prefix = directory ? `${directory}${path.sep}` : '';
  const parsed = filesUtil.readFile(`${prefix}${template}`);
  const { tree } = templatesUtil.parse(prefix, template);

  return tree;
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

const transformGeneric = (files, template) => [
  {
    filename: template.filename,
    files,
  },
];

const filterBlankLines = (content) =>
  content
    .split(/\n/)
    .map((line) => {
      const trimmed = line.trim();

      return trimmed === '' ? trimmed : line;
    })
    // .filter((line) => line.trim() !== '')
    .concat('')
    .join('\n');

const getUniqueNames = (files) => {
  const uniquelyNamedFiles = [];
  const filenames = {};

  for (const [index, file] of files.entries()) {
    const { filename } = file;

    if (!filenames[filename]) {
      filenames[filename] = [];
    }

    filenames[filename].push(index);
    uniquelyNamedFiles.push(file);
  }

  for (const [filename, indicies] of Object.entries(filenames)) {
    const lastDotIndex = filename.lastIndexOf('.');
    const prefix = filename.slice(0, lastDotIndex);
    const suffix = filename.slice(lastDotIndex + 1);

    if (indicies.length > 1) {
      for (const [index, filenameIndex] of indicies.entries()) {
        uniquelyNamedFiles[filenameIndex] = {
          ...uniquelyNamedFiles[filenameIndex],
          filename: `${prefix}.${index + 1}.${suffix}`,
        };
      }
    }
  }

  return uniquelyNamedFiles;
};

module.exports = convert;
