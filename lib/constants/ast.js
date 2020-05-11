const NODE_TYPES = {
  FOR_LOOP: 'for',
  PARTIAL: 'partial',
  TEXT: 'text',
};

const DIRECTIVES = {
  FOR_LOOP_END: 'FOR_LOOP_END',
  FOR_LOOP_START: 'FOR_LOOP_START',
  IMPORT_PARTIAL: 'IMPORT_PARTIAL',
};

const DIRECTIVE_REGEX = {
  [DIRECTIVES.FOR_LOOP_END]: /<!--\s*talc:endfor\s*-->/,
  [DIRECTIVES.FOR_LOOP_START]: /<!--\s*talc:for:([^\s-]+)\s*-->/,
  [DIRECTIVES.IMPORT_PARTIAL]: /<!--\s*talc:import:([^\s-]+)\s*-->/,
};

module.exports = {
  DIRECTIVE_REGEX,
  DIRECTIVES,
  NODE_TYPES,
};
