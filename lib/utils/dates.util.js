const { DateTime } = require('luxon');

const format = (date, format) => {
  let formatted = date;

  if (format !== 'YYYY-MM-dd HH:mm:ss') {
    formatted = DateTime.fromJSDate(new Date(date)).toFormat(format);
  }

  return formatted;
};

const getCurrent = () => DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');

module.exports = {
  format,
  getCurrent,
};
