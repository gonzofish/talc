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

const formatDate = () => {
  const now = new Date();
  const day = padDatePart(now.getDate());
  const month = padDatePart(now.getMonth() + 1);
  const year = now.getFullYear();
  const hour = padDatePart(now.getHours());
  const minutes = padDatePart(now.getMinutes());
  const seconds = padDatePart(now.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
};

const padDatePart = (value) => `0${value}`.slice(-2);

module.exports = generate;
