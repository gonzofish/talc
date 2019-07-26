const operators = require('./operators');

const run = (command, ...args) => {
  const config = operators.loadConfig();

  switch (command) {
    case 'n':
    case 'new':
      return operators.generateMarkdown(args[0], config);
    case 'p':
    case 'publish':
      return operators.convert(config);
    /* istanbul ignore next */
    default:
      return;
  }
};

/* istanbul ignore next */
if (!module.parent) {
  run(...process.argv.slice(2));
}

module.exports = run;
