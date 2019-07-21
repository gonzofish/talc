const fs = require('fs');
const path = require('path');

const generate = (title, { input }) => {
  const nameTokens = tokenizeNameFormat(input.nameFormat);
  const filename = formatName(nameTokens, title);

  fs.writeFileSync(path.join(input.dir, filename));
};

const tokenizeNameFormat = (format) => {
  // look for `[some-var]` => { type: 'variable', value: 'some-var' }
  // else => { type: 'literal', value: 'some-var' }
  const tokens = [];
  let currentToken = '';
  let isVariable = false;

  const addToken = () => {
    if (currentToken) {
      const token = {
        type: isVariable ? 'variable' : 'literal',
        value: currentToken,
      };

      tokens.push(token);

      currentToken = '';
    }

    isVariable = false;
  };

  for (const char of format) {
    if (!isVariable && char === '[') {
      addToken();
      isVariable = true;
    } else if (isVariable && char === ']') {
      addToken();
    } else {
      currentToken += char;
    }
  }

  addToken();

  return tokens;
};

const formatName = (tokens, title) => {
  const knownVars = {
    date: formatDate,
    title: () => formatTitle(title),
  };
  let name = '';

  for (const { type, value } of tokens) {
    if (type === 'variable' && knownVars[value]) {
      name += knownVars[value]();
    } else if (type === 'literal') {
      name += value;
    }
  }

  return `${name}.md`;
};

const formatDate = () => {
  const now = new Date();
  const day = padDatePart(now.getDate());
  const month = padDatePart(now.getMonth() + 1);
  const year = now.getFullYear();

  return `${year}-${month}-${day}`;
};

const padDatePart = (value) => `0${value}`.slice(-2);

const formatTitle = (title) => {
  // replace any spaces with -
  const spaceless = title.replace(/(\s+)/g, '-');

  return spaceless.toLowerCase();
};

module.exports = generate;
