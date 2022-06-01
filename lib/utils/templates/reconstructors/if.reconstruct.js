const reconstructIfBlock = (tree, metadata, reconstruct) => {
  const { child, condition } = tree.content;
  const match = condition.match(/(.+)(===|!==|>=|>|<=|<)(.+)/s);
  let content = '';

  if ((!match || match.length === 1) && metadata[condition]) {
    content += reconstruct(child, metadata);
  } else if (match && checkConditionTrue(match, metadata)) {
    content += reconstruct(child, metadata);
  }

  return content;
}

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
};

module.exports = reconstructIfBlock;
