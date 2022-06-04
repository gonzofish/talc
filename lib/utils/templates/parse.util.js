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

  /* istanbul ignore else */
  if (!tree) {
    const parser = new Parser(filename, prefix, templateCache);

    parser.parse();

    cached = parser.getCache();
    tree = parser.getTree();
  }

  return {
    cached,
    tree,
  };
};

class Parser {
  constructor(filename, prefix, cache) {
    this._cache = { ...cache };
    this._filename = filename;
    this._node = null;
    this._parent = null;
    this._prefix = prefix;
    this._previous = null;
    this._template = filesUtil.readFile(filename);
    this._tree = null;
  }

  static checkIsChildless(node) {
    return node
      && node.content
      && !node.content.child;
  }

  static findNextDirective(template) {
    let next;

    for (const directive of Object.values(DIRECTIVES)) {
      const match = template.match(DIRECTIVE_REGEX[directive]);

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
  }

  getCache() {
    return this._cache;
  }

  getTree() {
    return this._tree;
  }

  parse(template = this._template) {
    const directive = Parser.findNextDirective(template);

    if (!directive) {
      this._insertTextNode(template);
    } else {
      this._completePreviousNode(directive, template);
      this._handleDirective(directive, template);
      this._advanceTemplate(directive.match, template);
    }

    this._cache[this._filename] = this._tree;
  }

  _completePreviousNode({ match, directive }, template) {
    const needComplete = [
      DIRECTIVES.FOR_LOOP_START,
      DIRECTIVES.IF_BLOCK_START,
      DIRECTIVES.IMPORT_PARTIAL,
    ];

    /* istanbul ignore else */
    if (needComplete.includes(directive) && match.index > 0) {
      this._insertTextNode(template.slice(0, match.index));
    }
  }

  _handleDirective(directive, template) {
    switch (directive.directive) {
      case DIRECTIVES.FOR_LOOP_START:
        return this._insertForLoopStart(directive);
      case DIRECTIVES.IF_BLOCK_START:
        return this._insertIfBlockStart(directive);
      case DIRECTIVES.FOR_LOOP_END:
      case DIRECTIVES.IF_BLOCK_END:
        return this._insertEndNode(directive, template);
      case DIRECTIVES.IMPORT_PARTIAL:
        return this._insertPartial(directive, template)
    }
  }

  _insertForLoopStart(directive) {
    this._insertStartNode(
      NODE_TYPES.FOR_LOOP,
      directive.match,
      'variable',
    );
  }

  _insertIfBlockStart(directive, template) {
    this._insertStartNode(
      NODE_TYPES.IF_BLOCK,
      directive.match,
      'condition',
      template,
    );
  }

  _insertStartNode(type, match, variable) {
    const content = {
      child: null,
      [variable]: match[1],
    };

    this._insertNode(type, content);
    this._parent = this._node;
    this._previous = null;
  }

  _insertEndNode({ match }, template) {
    this._insertTextNode(template.slice(0, match.index));

    this._node = this._node.parent;
    this._previous = this._node;
    this._parent = this._node.parent;
  }

  _insertTextNode(text) {
    this._insertNode(NODE_TYPES.TEXT, text);
  }

  _insertPartial({ match }) {
    const file = match[1];
    let partialTree = this._cache[file];

    /* istanbul ignore else */
    if (!partialTree) {
      // create new parser and parse the partial file
      const {
        cache,
        tree,
      } = parse(this._prefix, file, this._cache);

      this._cache = {
        ...cache,
        ...this._cache,
      };
      partialTree = tree;
    }

    /* istanbul ignore else */
    if (partialTree) {
      this._insertNode(NODE_TYPES.PARTIAL, partialTree);
    }
  }

  _insertNode(type, content) {
    const node = {
      content,
      next: null,
      parent: this._parent,
      previous: this._previous,
      type,
    };

    if (this._previous) {
      this._previous.next = node;
    }

    if (Parser.checkIsChildless(node.parent)) {
      node.parent.content.child = node;
    }

    this._node = node;
    this._previous = node;

    if (!this._tree) {
      this._tree = node;
    }
  }

  _advanceTemplate(match, template) {
    const nextTemplate = template.slice(match.index + match[0].length);

    this.parse(nextTemplate);
  }
}

module.exports = parse;
