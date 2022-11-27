const NODE_TYPES = {
  ASSET: 'asset',
  FOR_LOOP: 'for',
  IF_BLOCK: 'if',
  PARTIAL: 'partial',
  TEXT: 'text',
};

const DIRECTIVES = {
  ASSET: 'ASSET',
  FOR_LOOP_END: 'FOR_LOOP_END',
  FOR_LOOP_START: 'FOR_LOOP_START',
  IF_BLOCK_END: 'IF_BLOCK_END',
  IF_BLOCK_START: 'IF_BLOCK_START',
  IMPORT_PARTIAL: 'IMPORT_PARTIAL',
};

const DIRECTIVE_REGEX = {
  [DIRECTIVES.ASSET]: /<!--\s*talc:asset:([^\s-]+)\s*-->/,
  [DIRECTIVES.FOR_LOOP_END]: /<!--\s*talc:endfor\s*-->/,
  [DIRECTIVES.FOR_LOOP_START]: /<!--\s*talc:for:([^\s-]+)\s*-->/,
  [DIRECTIVES.IF_BLOCK_END]: /<!--\s*talc:endif\s*-->/,
  [DIRECTIVES.IF_BLOCK_START]: /<!--\s*talc:if:\[([^\]]+)\]\s*-->/,
  [DIRECTIVES.IMPORT_PARTIAL]: /<!--\s*talc:import:([^\s-]+)\s*-->/,
};

module.exports = {
  DIRECTIVE_REGEX,
  DIRECTIVES,
  NODE_TYPES,
};
