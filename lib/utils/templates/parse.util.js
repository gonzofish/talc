const filesUtil = require('../files.util');

const parse = (prefix, file, templateCache = {}) => {
  const template = filesUtil.readFile(`${prefix}${file}`);
  let cached = { ...templateCache };
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
    const partial = subTemplate.match(/<!--\s*talc:import:([^\s-]+)\s*-->/);

    if (checkStartFirst(start, end)) {
      // new for loop
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
      // close previous for loop
      createNode('text', subTemplate.slice(0, end.index));

      node = node.parent;
      previous = node;
      ({ parent } = node);

      subTemplate = subTemplate.slice(end.index + end[0].length);
    } else if (partial) {
      if (partial.index > 0) {
        createNode('text', subTemplate.slice(0, partial.index));
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
        createNode('partial', partialTree);
      }

      subTemplate = subTemplate.slice(partial.index + partial[0].length);
    } else {
      // normal text node just add it
      createNode('text', subTemplate);
      subTemplate = null;
    }
  }

  cached[template] = firstNode;

  return {
    cached,
    tree: firstNode,
  };
};

const checkStartFirst = (start, end) => start && end && start.index < end.index;

const checkEndFirst = (start, end) =>
  end && (!start || start.index > end.index);

module.exports = parse;
