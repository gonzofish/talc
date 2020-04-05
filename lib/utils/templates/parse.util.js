const parse = (template) => {
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

module.exports = parse;
