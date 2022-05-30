const operators = require('./operators');
const loadConfig = require('./utils/config.util');

const run = (command, ...args) => {
  const config = loadConfig();

  switch (command) {
    case 'n':
    case 'new':
      return operators.generateMarkdown(args[0], config);
    case 'b':
    case 'build':
      return operators.convert(config);
    case 'publish':
    case 'p':
      return operators.publish(args[0], config);
    case 'update':
    case 'u':
      return operators.update(args[0], args[1], config);
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
