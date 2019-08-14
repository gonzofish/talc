const test = require('ava').default;
const { DateTime, Settings: LuxonSettings } = require('luxon');
const sinon = require('sinon');

const dates = require('../../lib/utils/dates.util');

test.before(() => {
  LuxonSettings.now = () => new Date('2010-03-27 04:30:37').valueOf();
  // const now = myDate.valueOf();

  // sinon.useFakeTimers({ now });
  sinon.stub(DateTime, 'fromJSDate').callThrough();
  sinon.stub(DateTime, 'local').callThrough();
});

test('#format should take a date string and format it to the provided format', (t) => {
  t.is(dates.format('2018-08-03 08:01:00', 'M/d/yyyy'), '8/3/2018');
});

test('#getCurrent should provide current date & time', (t) => {
  t.is(dates.getCurrent(), '2010-03-27 04:30:37');
});
