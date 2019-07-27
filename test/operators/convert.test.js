const test = require('ava').default;
const sinon = require('sinon');

const cheerio = require('cheerio');
const showdown = require('showdown');

const files = require('../../lib/utils/files.util');
const convert = require('../../lib/operators/convert');

const fixtures = require('./fixtures');

const setup = () => {
  const sandbox = sinon.createSandbox();
  const converterMock = {
    makeHtml: sinon.spy((contents) => {
      const metadataEnd = contents.lastIndexOf('---');
      let mainContent = contents;

      if (metadataEnd) {
        mainContent = contents.slice(metadataEnd + 3).trim();
      }

      return `HTML\n\n${mainContent}`;
    }),
  };

  sandbox.stub(showdown, 'Converter').returns(converterMock);
  sandbox.stub(files, 'writeFiles');
  sandbox.stub(files, 'readFiles').returns(fixtures.load('files'));

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

  t.true(showdown.Converter.calledWith({ metadata: true }));
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

  const findComment = mockCheerioChain.filter.firstCall.args[0];

  t.true(findComment(0, { type: 'comment', data: 'talc-content   ' }));
  t.false(findComment(1, { type: 'a', data: 'talc-content' }));
  t.false(findComment(2, { type: 'comment', data: 'talccontent' }));

  sandbox.restore();
});

// NEED TO PARSE YAML metadata to use as variables
// variables will be talc:<variable>
// understood vars: title, date, tags (comma-separated)
