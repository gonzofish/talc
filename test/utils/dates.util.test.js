const test = require('ava').default;

const dates = require('../../lib/utils/dates.util');
const { mockDate } = require('../test-utils');

let clock;

test.before(() => {
  clock = mockDate('2010-03-27 04:30:37');
});

test.after(() => {
  clock.restore();
});

test('#format should take a date string and format it to the provided format', (t) => {
  t.is(dates.format('2018-08-03 08:01:00', 'M/d/yyyy'), '8/3/2018');
});

test('#getCurrent should provide current date & time', (t) => {
  t.is(dates.getCurrent(), '2010-03-27 04:30:37');
});

test('#convertToDate should create a date time from a provided date string', (t) => {
  const date = new Date('2018-08-03 08:01:00');
  const result = dates.convertToDate('2018-08-03 08:01:00');

  t.is(result.valueOf(), date.valueOf());
});

test('#convertToDate should create a date time from a provided date string using a provided format', (t) => {
  const date = new Date('2018-08-03 00:00:00');
  const result = dates.convertToDate('03 Aug 18', 'dd MMM yy');

  t.is(result.valueOf(), date.valueOf());
});
