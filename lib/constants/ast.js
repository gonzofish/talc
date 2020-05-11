const NODE_TYPES = {
  FOR_LOOP: 'for',
  PARTIAL: 'partial',
  TEXT: 'text',
};

const TALC_REGEX = {
  FOR_LOOP_END: /<!--\s*talc:endfor\s*-->/,
  FOR_LOOP_START: /<!--\s*talc:for:([^\s-]+)\s*-->/,
  IMPORT_PARTIAL: /<!--\s*talc:import:([^\s-]+)\s*-->/,
};

module.exports = {
  TALC_REGEX,
  NODE_TYPES,
};
