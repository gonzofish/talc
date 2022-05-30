const sinon = require('sinon');

/* istanbul ignore file */
const mockDate = (date) => (
  sinon.useFakeTimers(new Date(date).valueOf())
);

module.exports = {
  mockDate,
};
