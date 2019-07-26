const test = require('ava').default;
const sinon = require('sinon');

const cheerio = require('cheerio');
const showdown = require('showdown');

const files = require('../../lib/utils/files.util');
const convert = require('../../lib/operators/convert');

const setup = () => {
  const sandbox = sinon.createSandbox();
  const converterMock = {
    makeHtml: sinon.spy((contents) => `HTML\n\n${contents}`),
  };

  sandbox.stub(showdown, 'Converter').returns(converterMock);
  sandbox.stub(files, 'writeFiles');
  sandbox.stub(files, 'readFiles').returns([
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

  return {
    converterMock,
    sandbox,
  };
};

test('should convert a markdown file to HTML via showdown', (t) => {
  const { sandbox } = setup();
  const config = {
    input: 'input',
    output: 'output',
  };

  convert(config);

  t.true(showdown.Converter.calledWith());
  t.true(files.readFiles.calledWith('input', 'md'));
  t.true(
    files.writeFiles.calledWith('output', [
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

test('should insert HTML contents into a template, if one exists', (t) => {
  const { sandbox } = setup();
  const config = {
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };
  const template = '<html><body>my template</body></html>';
  const mockCheerioChain = {
    contents: sinon.spy(() => mockCheerioChain),
    filter: sinon.spy(() => mockCheerioChain),
    replaceWith: sinon.spy(),
  };
  const mockCheerio = sinon.spy(() => mockCheerioChain);

  mockCheerio.html = sinon.spy(() => `CHEERIO! ${mockCheerio.html.callCount}`);
  // mockCheerioChain.contents = sinon.spy(() => mockCheerioChain);
  // mockCheerioChain.filter = sinon.spy(() => mockCheerioChain);
  // mockCheerioChain.replaceWith = sinon.spy();

  sandbox.stub(cheerio, 'load').returns(mockCheerio);
  sandbox.stub(files, 'readFile').returns(template);

  convert(config);

  t.true(files.readFile.calledWith('my-template.html'));
  t.true(cheerio.load.calledWith(template));
  t.true(mockCheerio.calledWith('*'));
  t.is(mockCheerioChain.contents.callCount, 3);
  t.is(mockCheerioChain.filter.callCount, 3);
  t.true(mockCheerioChain.replaceWith.calledWith('HTML\n\n# File #1'));
  t.true(mockCheerioChain.replaceWith.calledWith('HTML\n\n# File Ehhhhh'));
  t.true(
    mockCheerioChain.replaceWith.calledWith('HTML\n\n# Sleepy Time\n\nZzz'),
  );
  t.true(
    files.writeFiles.calledWith('output', [
      {
        contents: 'CHEERIO! 1',
        filename: 'file1.html',
      },
      {
        contents: 'CHEERIO! 2',
        filename: 'fileA.html',
      },
      {
        contents: 'CHEERIO! 3',
        filename: 'Zzz.html',
      },
    ]),
  );

  sandbox.restore();
});

// NEED TO PARSE YAML metadata to use as variables
// variables will be talc:<variable>
// understood vars: title, date, tags (comma-separated)
