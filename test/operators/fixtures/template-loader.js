const fs = require('fs');
const path = require('path');

module.exports = (templateName) => {
  const file = path.join(__dirname, 'templates', `${templateName}.html`);

  if (!fs.existsSync(file)) {
    throw new Error(`The template ${templateName} does not exists!`);
  }

  return fs.readFileSync(file, {
    encoding: 'utf8',
  });
};
