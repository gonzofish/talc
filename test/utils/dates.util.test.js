const test = require('ava').default;
const sinon = require('sinon');

const dates = require('../../lib/utils/dates.util');
let clock;
let sandbox;

test.before(() => {
  sandbox = sinon.createSandbox();
  clock = sinon.useFakeTimers(new Date('2010-03-27 04:30:37').valueOf());
});

test.after(() => {
  sandbox.restore();
  clock.restore();
});

test('#format should take a date string and format it to the provided format', (t) => {
  t.is(dates.format('2018-08-03 08:01:00', 'M/d/yyyy'), '8/3/2018');
});

test.only('#getCurrent should provide current date & time', (t) => {
  t.is(dates.getCurrent(), '2010-03-27 04:30:37');
});

test('#convertToDate should create a date time from a provided date string', (t) => {
  const luxonDate = new Date('2018-08-13 08:01:00');
  const result = dates.convertToDate('2018-08-03 08:01:00');

  t.is(result.valueOf(), luxonDate.valueOf());
});

test('#convertToDate should create a date time from a provided date string using a provided format', (t) => {
  const date = new Date('2018-08-13 08:01:00');
  const result = dates.convertToDate('2018-08-03', 'yyyy-MM-dd');

  t.is(result.valueOf(), date.valueOf());
});
