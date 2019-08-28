const { DateTime } = require('luxon');

const DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const format = (date, format) => {
  let formatted = date;

  if (format !== DEFAULT_FORMAT) {
    formatted = DateTime.fromJSDate(new Date(date)).toFormat(format);
  }

  return formatted;
};

const getCurrent = () => DateTime.local().toFormat(DEFAULT_FORMAT);

const toLuxon = (date, format = DEFAULT_FORMAT) =>
  DateTime.fromFormat(date, format);

module.exports = {
  format,
  getCurrent,
  toLuxon,
};
