const test = require('ava').default;
const sinon = require('sinon');

const dates = require('../../lib/utils/dates.util');

test.before(() => {
  const myDate = new Date('2010-03-27 04:30:37');
  const now = myDate.valueOf();

  sinon.useFakeTimers({ now });
});

test('#getCurrent should provide current date & time', (t) => {
  t.is(dates.getCurrent(), '2010-03-27 04:30:37');
});
