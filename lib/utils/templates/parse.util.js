const {
  DIRECTIVES,
  DIRECTIVE_REGEX,
  NODE_TYPES,
} = require('../../constants/ast');
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

    // set the new node to previous nodes
    // next sibling
    if (previous) {
      previous.next = node;
    }

    // if the node is a child (its in a bloack) and
    // its parent has no first child set, set this
    // node as the parent's first child
    if (node.parent && node.parent.content && !node.parent.content.child) {
      node.parent.content.child = node;
    }

    previous = node;

    // if a tree hasn't been established (the root node)
    // set this node as the root
    if (!tree) {
      tree = node;
    }
  };

  while (subTemplate) {
    const nextDirective = findNextDirective(subTemplate);

    if (!nextDirective) {
      // normal text node just add the rest of the subTemplate
      createNode(NODE_TYPES.TEXT, subTemplate);
      subTemplate = null;
    } else if (nextDirective.directive === DIRECTIVES.FOR_LOOP_START) {
      const { match } = nextDirective;

      if (match.index > 0) {
        createNode(NODE_TYPES.TEXT, subTemplate.slice(0, match.index));
      }

      createNode(NODE_TYPES.FOR_LOOP, {
        child: null,
        variable: match[1],
      });
      parent = node;
      previous = null;

      subTemplate = subTemplate.slice(match.index + match[0].length);
    } else if (nextDirective.directive === DIRECTIVES.FOR_LOOP_END) {
      const { match } = nextDirective;
      createNode(NODE_TYPES.TEXT, subTemplate.slice(0, match.index));

      node = node.parent;
      previous = node;
      ({ parent } = node);

      subTemplate = subTemplate.slice(match.index + match[0].length);
    } else if (nextDirective.directive === DIRECTIVES.IMPORT_PARTIAL) {
      const { match } = nextDirective;

      if (match.index > 0) {
        createNode(NODE_TYPES.TEXT, subTemplate.slice(0, match.index));
      }

      const partialFile = match[1];
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

      subTemplate = subTemplate.slice(match.index + match[0].length);
    }
  }

  cached[template] = tree;

  return { tree, cached };
};

const findNextDirective = (subTemplate) => {
  let next;

  for (const directive of Object.values(DIRECTIVES)) {
    const match = subTemplate.match(DIRECTIVE_REGEX[directive]);

    // if we haven't found a next or the current match
    // comes before the current next
    if (match && (!next || match.index < next.match.index)) {
      next = {
        directive,
        match,
      };
    }
  }

  return next;
};

module.exports = parse;
