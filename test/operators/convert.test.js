const test = require('ava').default;
const sinon = require('sinon');
const showdown = require('showdown');

const files = require('../../lib/utils/files.util');
const convert = require('../../lib/operators/convert');

test('should convert a markdown file to HTML via showdown', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    input: 'input',
    output: 'output',
  };
  const converter = {
    makeHtml: sinon.spy((contents) => `HTML\n\n${contents}`),
  };
  const writeFiles = sandbox.stub(files, 'writeFiles');
  const readFiles = sandbox.stub(files, 'readFiles').returns([
    {
      contents: '# File #1',
      filename: 'file1.md',
    },
    {
      contents: '# File Ehhhhh',
      filename: 'fileA.md',
    },
    {
      contents: '# Sleepy Time\n\nZzz',
      filename: 'Zzz.md',
    },
  ]);

  sandbox.stub(showdown, 'Converter').returns(converter);

  convert(config);

  t.true(readFiles.calledWith('input', 'md'));
  t.true(
    writeFiles.calledWith('output', [
      {
        contents: 'HTML\n\n# File #1',
        filename: 'file1.html',
      },
      {
        contents: 'HTML\n\n# File Ehhhhh',
        filename: 'fileA.html',
      },
      {
        contents: 'HTML\n\n# Sleepy Time\n\nZzz',
        filename: 'Zzz.html',
      },
    ]),
  );

  sandbox.restore();
});
