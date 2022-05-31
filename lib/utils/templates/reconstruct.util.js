const { NODE_TYPES } = require('../../constants/ast');
const { checkIsType, TYPES } = require('../types.util');

const reconstruct = (tree, metadata, contents) => {
  let content = '';

  /* istanbul ignore else */
  if (tree.type === NODE_TYPES.TEXT) {
    ({ content } = tree);
  } else if (tree.type === NODE_TYPES.PARTIAL) {
    content += reconstruct(tree.content, metadata);
  } else if (tree.type === NODE_TYPES.FOR_LOOP) {
    const { variable } = tree.content;
    const metadataValue =
      metadata[variable] ||
      (checkIsType(contents, TYPES.OBJECT) && contents[variable]);

    if (Array.isArray(metadataValue)) {
      for (const value of metadataValue) {
        content += reconstruct(tree.content.child, metadata, value);
      }
    }
  } else if (tree.type === NODE_TYPES.IF_BLOCK) {
    const { child, condition } = tree.content;
    const match = condition.match(/(.+)(===|!==|>=|>|<=|<)(.+)/s);

    if ((!match || match.length === 1) && metadata[condition]) {
      content += reconstruct(child, metadata);
    } else if (match && checkConditionTrue(match, metadata)) {
      content += reconstruct(child, metadata);
    }
  }

  content = replaceVariables(content, metadata, contents);

  if (tree.next) {
    content += reconstruct(tree.next, metadata, contents);
  }

  return content;
};

const checkConditionTrue = (match, metadata) => {
  const lhs = match[1].trim();
  const op = match[2].trim();
  const rhs = match[3].trim();
  let isTrue = false;
  let eqValue;
  let value;

  /* istanbul ignore else */
  if (lhs in metadata) {
    value = metadata[lhs];
    eqValue = rhs;
  } else if (rhs in metadata) {
    value = metadata[rhs];
    eqValue = lhs;
  }

  /* istanbul ignore else */
  if (value && eqValue) {
    isTrue = evaluateCondition(op, value, eqValue);
  }

  return isTrue;
};

const evaluateCondition = (op, value, eqValue) => {
  const evalValue = convertValue(value);
  const evalEqValue = convertValue(eqValue);

  switch (op) {
    case '===':
      return evalValue === evalEqValue;
    case '!==':
      return evalValue !== evalEqValue;
    case '<':
      return evalValue < evalEqValue;
    case '>=':
      return evalValue >= evalEqValue;
    case '>':
      return evalValue > evalEqValue;
    case '<=':
      return evalValue <= evalEqValue;
    /* istanbul ignore next */
    default:
      return false;
  }
};

const convertValue = (value) => {
  let converted = value;

  try {
    converted = eval(value);
  } catch (e) {
    converted = value;
  }

  return converted;
}

const replaceVariables = (content, metadata, contents) => {
  const variableRegex = /<!--\s*talc:([a-zA-Z0-9_]+)\s*-->/;
  let replaced = content;
  let talcVar;

  while ((talcVar = variableRegex.exec(replaced))) {
    const variable = talcVar[1].trim();
    let value = '';

    if (variable === 'content') {
      value = contents;
    } else if (metadata[variable]) {
      value = metadata[variable];
    } else if (checkIsType(contents, TYPES.OBJECT) && contents[variable]) {
      value = contents[variable];
    }

    replaced =
      replaced.slice(0, talcVar.index) +
      value +
      replaced.slice(talcVar.index + talcVar[0].length);
  }

  return replaced;
};

module.exports = reconstruct;
