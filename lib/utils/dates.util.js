const dateFnsFormat = require('date-fns/format');
const parse = require('date-fns/parse');

const DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const format = (date, dateFormat) => {
  let formatted = date;

  if (dateFormat !== DEFAULT_FORMAT) {
    formatted = dateFnsFormat(new Date(date), dateFormat);
  }

  return formatted;
};

const getCurrent = () => dateFnsFormat(new Date(), DEFAULT_FORMAT);

const convertToDate = (
  date,
  /* istanbul ignore next */
  dateFormat = DEFAULT_FORMAT
) =>
  parse(date, dateFormat, new Date());

module.exports = {
  format,
  getCurrent,
  convertToDate,
};
