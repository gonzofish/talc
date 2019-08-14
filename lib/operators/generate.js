const fs = require('fs');
const path = require('path');

const datesUtil = require('../utils/dates.util');

const generate = (title, { input: inputDir }) => {
  const date = datesUtil.getCurrent();
  const filename = formatTitle(title, date);

  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir);
  }

  fs.writeFileSync(
    path.join(inputDir, filename),
    generateContents(title, date),
  );
};

const generateContents = (title, date) => `---
title: ${title}
created_date: ${date}
---
# ${title}

`;

const formatTitle = (title) => {
  // replace any spaces with -
  const spaceless = title.replace(/(\s+)/g, '-');

  return `${spaceless.toLowerCase()}.md`;
};

module.exports = generate;
