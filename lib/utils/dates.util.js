const getCurrent = () => {
  const now = new Date();
  const day = padDatePart(now.getDate());
  const month = padDatePart(now.getMonth() + 1);
  const year = now.getFullYear();
  const hour = padDatePart(now.getHours());
  const minutes = padDatePart(now.getMinutes());
  const seconds = padDatePart(now.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
};

const padDatePart = (value) => `0${value}`.slice(-2);

module.exports = {
  getCurrent,
};
