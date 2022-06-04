const reconstructForLoop = (tree, metadata, reconstruct) => {
  const { variable } = tree.content;
  const metadataValue = metadata[variable];
  let content = '';

  if (Array.isArray(metadataValue)) {
    for (const value of metadataValue) {
      content += reconstruct(tree.content.child, metadata, value);
    }
  }

  return content;
};

module.exports = reconstructForLoop;
