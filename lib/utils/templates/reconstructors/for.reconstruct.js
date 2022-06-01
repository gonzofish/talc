const { checkIsType, TYPES } = require("../../types.util");

const reconstructForLoop = (tree, metadata, contents, reconstruct) => {
  const { variable } = tree.content;
  const metadataValue = metadata[variable] ||
      (checkIsType(contents, TYPES.OBJECT) && contents[variable]);
  let content = '';

  if (Array.isArray(metadataValue)) {
    for (const value of metadataValue) {
      content += reconstruct(tree.content.child, metadata, value);
    }
  }

  return content;
};

module.exports = reconstructForLoop;
