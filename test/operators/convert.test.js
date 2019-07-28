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
    metadata: {},
    getMetadata: () => converterMock.metadata,
    makeHtml: sinon.spy((contents) => {
      const metadataEnd = contents.lastIndexOf('---');
      let mainContent = contents;

      if (metadataEnd) {
        mainContent = contents.slice(metadataEnd + 3).trim();

        const variables = contents
          .slice(0, metadataEnd)
          .replace(/---/g, '')
          .trim()
          .split(/\n/);
        const metadata = {};

        for (const variable of variables) {
          const matches = variable.match(/^([^:]+):(.+)$/);

          if (matches) {
            const [, name, value] = matches;
            metadata[name.trim()] = value.trim();
          }
        }

        converterMock.metadata = metadata;
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
        contents: 'HTML\n\nFirst!!1',
        filename: 'file-1.html',
        metadata: {
          publish_date: '2018-08-03 08:01:00',
          title: 'File #1',
        },
      },
      {
        contents: 'HTML\n\nThis file is so iffy',
        filename: 'file-ehhhhh.html',
        metadata: {
          publish_date: '2010-03-27 04:30:30',
          title: 'File Ehhhhh',
        },
      },
      {
        contents: 'HTML\n\nZzz',
        filename: 'sleepy-time.html',
        metadata: {
          created_date: '1984-08-13 02:30:00',
          publish_date: '2002-08-13 00:00:00',
          title: 'Sleepy Time',
        },
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
    replaceWith: sinon.spy((fn) =>
      fn(0, {
        data: 'talc:content',
      }),
    ),
  };
  const mockCheerio = sinon.spy(() => mockCheerioChain);

  mockCheerio.html = sinon.spy(() => `CHEERIO! ${mockCheerio.html.callCount}`);

  sandbox.stub(cheerio, 'load').returns(mockCheerio);
  sandbox.stub(files, 'readFile').returns(template);

  convert(config);

  t.true(files.readFile.calledWith('my-template.html'));
  t.true(cheerio.load.calledWith(template));
  t.true(mockCheerio.calledWith('*'));
  t.is(mockCheerioChain.contents.callCount, 3);
  t.is(mockCheerioChain.filter.callCount, 3);
  t.is(mockCheerioChain.replaceWith.callCount, 3);
  t.true(
    files.writeFiles.calledWith('output', [
      {
        contents: 'CHEERIO! 1',
        filename: 'file-1.html',
        metadata: {
          publish_date: '2018-08-03 08:01:00',
          title: 'File #1',
        },
      },
      {
        contents: 'CHEERIO! 2',
        filename: 'file-ehhhhh.html',
        metadata: {
          publish_date: '2010-03-27 04:30:30',
          title: 'File Ehhhhh',
        },
      },
      {
        contents: 'CHEERIO! 3',
        filename: 'sleepy-time.html',
        metadata: {
          created_date: '1984-08-13 02:30:00',
          publish_date: '2002-08-13 00:00:00',
          title: 'Sleepy Time',
        },
      },
    ]),
  );

  const findComment = mockCheerioChain.filter.firstCall.args[0];

  t.true(findComment(0, { type: 'comment', data: 'talc:content   ' }));
  t.true(findComment(1, { type: 'comment', data: 'talc:publish_date' }));
  t.false(findComment(2, { type: 'a', data: 'talc:content' }));
  t.false(findComment(3, { type: 'comment', data: 'talccontent' }));

  sandbox.restore();
});
