const fs = require('fs');
const path = require('path');

const generate = (title, { input: inputDir }) => {
  const date = formatDate();
  const filename = formatTitle(title, date);

  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir);
  }

  fs.writeFileSync(
    path.join(inputDir, filename),
    generateContents(title, date),
  );
};

const generateContents = (title) => `# ${title}\n\n`;

const formatTitle = (title, date) => {
  // replace any spaces with -
  const spaceless = title.replace(/(\s+)/g, '-');
  const titleDate = date.replace(/(-|:)/g, '').replace(/\s+/g, '_');

  return `${titleDate}_${spaceless.toLowerCase()}.md`;
};

const formatDate = () => {
  const now = new Date();
  const day = padDatePart(now.getDate());
  const month = padDatePart(now.getMonth() + 1);
  const year = now.getFullYear();
  const hour = padDatePart(now.getHours());
  const minutes = padDatePart(now.getMinutes());

  return `${year}-${month}-${day} ${hour}:${minutes}`;
};

const padDatePart = (value) => `0${value}`.slice(-2);

module.exports = generate;
