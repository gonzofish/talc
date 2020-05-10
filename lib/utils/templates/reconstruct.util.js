const { checkIsType, TYPES } = require('../types.util');

const reconstruct = (tree, metadata, contents) => {
  let content = '';

  if (tree.type === 'text') {
    ({ content } = tree);
  } else if (tree.type === 'partial') {
    content += reconstruct(tree.content, metadata);
  } else if (tree.type === 'for') {
    const { variable } = tree.content;
    const metadataValue =
      metadata[variable] ||
      (checkIsType(contents, TYPES.OBJECT) && contents[variable]);

    if (Array.isArray(metadataValue)) {
      for (const value of metadataValue) {
        content += reconstruct(tree.content.child, metadata, value);
      }
    }
  }

  content = replaceVariables(content, metadata, contents);

  if (tree.next) {
    content += reconstruct(tree.next, metadata, contents);
  }

  return content;
};

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
