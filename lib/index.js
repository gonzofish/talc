const operators = require('./operators');

const run = (command, ...args) => {
  const config = operators.loadConfig();

  switch (command) {
    case 'n':
    case 'new':
      return operators.generateMarkdown(args[0], config);
    default:
      return;
  }
};

if (!module.parent) {
  run(...process.argv.slice(2));
}

module.exports = run;
