const { NODE_TYPES, TALC_REGEX } = require('../../constants/ast');
const filesUtil = require('../files.util');

const parse = (prefix, file, templateCache = {}) => {
  const filename = `${prefix}${file}`;
  let cached = templateCache;
  let tree = templateCache[filename];

  if (!tree) {
    ({ tree, cached } = parseTemplate(filename, prefix, templateCache));
  }

  return {
    cached,
    tree,
  };
};

const parseTemplate = (filename, prefix, templateCache) => {
  const template = filesUtil.readFile(filename);
  let cached = { ...templateCache };
  let subTemplate = template;
  let tree = null;
  let node = null;
  let parent = null;
  let previous = null;

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

    if (!tree) {
      tree = node;
    }
  };

  while (subTemplate) {
    const start = subTemplate.match(TALC_REGEX.FOR_LOOP_START);
    const end = subTemplate.match(TALC_REGEX.FOR_LOOP_END);
    const partial = subTemplate.match(TALC_REGEX.IMPORT_PARTIAL);

    if (checkStartFirst(start, end)) {
      // new for loop
      if (start.index > 0) {
        createNode(NODE_TYPES.TEXT, subTemplate.slice(0, start.index));
      }

      createNode(NODE_TYPES.FOR_LOOP, {
        child: null,
        variable: start[1],
      });
      parent = node;
      previous = null;

      subTemplate = subTemplate.slice(start.index + start[0].length);
    } else if (checkEndFirst(start, end)) {
      // close previous for loop
      createNode(NODE_TYPES.TEXT, subTemplate.slice(0, end.index));

      node = node.parent;
      previous = node;
      ({ parent } = node);

      subTemplate = subTemplate.slice(end.index + end[0].length);
    } else if (partial) {
      if (partial.index > 0) {
        createNode(NODE_TYPES.TEXT, subTemplate.slice(0, partial.index));
      }

      const [, partialFile] = partial;
      let partialTree = cached[partialFile];

      if (!partialTree) {
        const parsedPartial = parse(prefix, partialFile, cached);

        cached = {
          ...parsedPartial.cached,
          ...cached,
        };
        partialTree = parsedPartial.tree;
      }

      if (partialTree) {
        createNode(NODE_TYPES.PARTIAL, partialTree);
      }

      subTemplate = subTemplate.slice(partial.index + partial[0].length);
    } else {
      // normal text node just add it
      createNode(NODE_TYPES.TEXT, subTemplate);
      subTemplate = null;
    }
  }

  cached[template] = tree;

  return { tree, cached };
};

const checkStartFirst = (start, end) => start && end && start.index < end.index;

const checkEndFirst = (start, end) =>
  end && (!start || start.index > end.index);

module.exports = parse;
