const load = (fixtureName) => {
  let fixture;

  try {
    fixture = require(`./${fixtureName}.fixture`);
  } catch (e) {
    console.error(`The fixture ${fixtureName} doesn't exist`);
  }

  return fixture;
};

module.exports = { load };
