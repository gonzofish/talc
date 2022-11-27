const path = require('path');
const showdown = require('showdown');

const datesUtil = require('../utils/dates.util');
const filesUtil = require('../utils/files.util');
const templatesUtil = require('../utils/templates');

const convert = (config) => {
  const { assets, byType, byFilename } = partitionTemplates(
    config.pages.templates,
    config.pages.directory,
  );
  const files = filesUtil.readFiles(config.published, 'md');

  const postFiles = transformPosts(byType.post, files, config);
  const listingFiles = transformListings(
    byType.listing,
    postFiles,
    config,
    byFilename,
  );
  const uniqueFiles = getUniqueNames(postFiles.concat(listingFiles));
  const managed = manageAssets(uniqueFiles);
  let uniqueAssets = Array.from(new Set([...assets, ...managed.assets]));
  let renameAsset;

  if (config.assets) {
    renameAsset = (asset) =>
      asset.replace(new RegExp(`^${path.join(config.assets, path.sep)}`), '');
    uniqueAssets = uniqueAssets.map((asset) => path.join(config.assets, asset));
  }

  filesUtil.writeFiles(config.built, managed.files);
  filesUtil.copyFiles(config.built, uniqueAssets, renameAsset);
};

const partitionTemplates = (templates, directory) => {
  const byType = {
    listing: [],
    post: [],
  };
  const allAssets = [];
  const prefix = directory ? `${directory}${path.sep}` : '';
  let byFilename = {};

  for (const template of templates) {
    const { assets, cached, tree } = templatesUtil.parse(
      prefix,
      template.template,
      byFilename,
    );
    let type = template.type;

    byFilename = {
      ...cached,
      ...byFilename,
    };
    allAssets.push(...assets);

    /* istanbul ignore else */
    if (tree) {
      byType[type].push({
        ...template,
        tree,
      });
    }
  }

  if (byType.post.length === 0) {
    // ensure if no post types that we still
    // produce post files
    byType.post.push(null);
  }

  return { assets: allAssets, byFilename, byType };
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
    case 'update_date':
      return datesUtil.format(value, config.dateFormat);
    case 'tags':
      return value.split(',').map((tag) => tag.toLowerCase().trim());
    default:
      return value;
  }
};

const transformListings = (
  templates,
  posts,
  { dateFormat, pages },
  templateCache,
) => {
  const listings = [];
  let cached = { ...templateCache };

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
      let { tree } = template;

      if (output.template) {
        const transformedTemplate = getTransformedTemplate(
          output.template,
          pages.directory,
          templateCache,
        );

        cached = {
          ...cached,
          ...transformedTemplate.cached,
        };
        ({ tree } = transformedTemplate);
      }

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

const getTransformedTemplate = (template, directory, templateCache) => {
  const prefix = directory ? `${directory}${path.sep}` : '';

  return templatesUtil.parse(prefix, template, templateCache);
};

const sortFiles = (files, config) => {
  const { sortBy } = config;

  return files.slice().sort((a, b) => {
    let direction = 0;
    let counter = 0;

    while (direction === 0 && counter < sortBy.length) {
      direction = compareBy(sortBy[counter], a.metadata, b.metadata, config);

      counter++;
    }

    return direction;
  });
};

const compareBy = (attribute, metaA, metaB, config) => {
  let compare = compareStrings;
  let aValue = metaA[attribute];
  let bValue = metaB[attribute];

  if (
    attribute === 'publish_date' ||
    attribute === 'create_date' ||
    attribute === 'update_date'
  ) {
    [aValue, bValue] = ensureDateValues(attribute, metaA, metaB);
    compare = compareDates;
  }

  return compare(aValue, bValue, config);
};

const ensureDateValues = (attribute, metaA, metaB) => {
  let aValue = metaA[attribute];
  let bValue = metaB[attribute];

  if (attribute === 'update_date') {
    aValue = ensureUpdateDate(metaA);
    bValue = ensureUpdateDate(metaB);
  }

  return [aValue, bValue];
};

const ensureUpdateDate = (metadata) =>
  metadata.update_date || metadata.publish_date;

const compareDates = (a, b, { dateFormat }) => {
  const dateA = datesUtil.convertToDate(a, dateFormat);
  const dateB = datesUtil.convertToDate(b, dateFormat);

  return dateB.valueOf() - dateA.valueOf();
};

const compareStrings = (a, b) => {
  const stringA = ('' + a).toLowerCase();
  const stringB = ('' + b).toLowerCase();
  let direction = 0;

  /* istanbul ignore else */
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

const manageAssets = (files) => {
  const assetRegex = /%talc:asset:([^%]*)%/g;
  const assets = [];
  const managedFiles = [];

  for (const file of files) {
    const managedContents = file.contents.replace(
      assetRegex,
      (_match, file) => {
        assets.push(file);

        return file;
      },
    );

    managedFiles.push({
      ...file,
      contents: managedContents,
    });
  }

  return { assets, files: managedFiles };
};

module.exports = convert;
