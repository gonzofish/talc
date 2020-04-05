const TYPES = Object.freeze({
  BIG_INT: 'bigint',
  FUNCTION: 'function',
  MAP: 'map',
  NULL: 'null',
  NUMBER: 'number',
  OBJECT: 'object',
  SET: 'set',
  STRING: 'string',
  UNDEFINED: 'undefined',
});

const checkIsType = (value, type) => getType(value) === type;

const getType = (value) =>
  Object.prototype.toString
    .call(value)
    .replace(/(^\[object |\])/g, '')
    .toLowerCase();

module.exports = {
  checkIsType,
  getType,
  TYPES,
};
