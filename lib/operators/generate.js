const fs = require('fs');
const path = require('path');

const datesUtil = require('../utils/dates.util');

const generate = (title, { drafts: draftsDir }) => {
  const date = datesUtil.getCurrent();
  const filename = formatTitle(title, date);

  if (!fs.existsSync(draftsDir)) {
    fs.mkdirSync(draftsDir);
  }

  fs.writeFileSync(
    path.join(draftsDir, filename),
    generateContents(title, date),
  );
};

const generateContents = (title, date) => `---
title: ${title}
create_date: ${date}
---
# ${title}

`;

const formatTitle = (title) => {
  // replace any spaces with -
  const spaceless = title.replace(/(\s+)/g, '-');

  return `${spaceless.toLowerCase()}.md`;
};

module.exports = generate;
