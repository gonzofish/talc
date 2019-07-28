const test = require('ava').default;
const sinon = require('sinon');

const cheerio = require('cheerio');
const showdown = require('showdown');

const convert = require('../../lib/operators/convert');
const dates = require('../../lib/utils/dates.util');
const files = require('../../lib/utils/files.util');

const fixtures = require('./fixtures');

const setupCheerio = (template) => {
  const { sandbox } = setup();
  const mockCheerioChain = {
    contents: sinon.spy(() => mockCheerioChain),
    filter: sinon.spy(() => mockCheerioChain),
    replaceWith: sinon.stub(),
  };
  const mockCheerio = sinon.spy(() => mockCheerioChain);

  mockCheerio.html = sinon.spy(() => `CHEERIO! ${mockCheerio.html.callCount}`);

  sandbox.stub(cheerio, 'load').returns(mockCheerio);
  sandbox.stub(files, 'readFile').returns(template);

  return {
    mocks: {
      cheerio: mockCheerio,
      cheerioChain: mockCheerioChain,
    },
    sandbox,
    template,
  };
};

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
          unknown: 'hey yo',
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
  const template = '<html><body>my template</body></html>';
  const { mocks, sandbox } = setupCheerio(template);
  const config = {
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  convert(config);

  t.true(files.readFile.calledWith('my-template.html'));
  t.true(cheerio.load.calledWith(template));
  t.true(mocks.cheerio.calledWith('*'));
  t.is(mocks.cheerioChain.contents.callCount, 3);
  t.is(mocks.cheerioChain.filter.callCount, 3);
  t.is(mocks.cheerioChain.replaceWith.callCount, 3);
  t.true(
    files.writeFiles.calledWith('output', [
      {
        contents: 'CHEERIO! 1',
        filename: 'file-1.html',
        metadata: {
          publish_date: '2018-08-03 08:01:00',
          title: 'File #1',
          unknown: 'hey yo',
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

  const filter = mocks.cheerioChain.filter.firstCall.args[0];

  t.true(filter(0, { type: 'comment', data: 'talc:content   ' }));
  t.true(filter(1, { type: 'comment', data: 'talc:publish_date' }));
  t.false(filter(2, { type: 'a', data: 'talc:content' }));
  t.false(filter(3, { type: 'comment', data: 'talccontent' }));

  const replace = mocks.cheerioChain.replaceWith.firstCall.args[0];

  t.is(
    replace(0, {
      data: 'talc:content',
    }),
    'HTML\n\nFirst!!1',
  );

  sandbox.restore();
});

test('should replace variables', (t) => {
  const template = '<html><body><!-- talc:publish_date --></body></html>';
  const { mocks, sandbox } = setupCheerio(template);
  const config = {
    dateFormat: 'M/d/yyyy',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(dates, 'format').callThrough();

  convert(config);

  const replace = mocks.cheerioChain.replaceWith.firstCall.args[0];

  replace(0, {
    data: 'talc:publish_date',
  });

  t.true(dates.format.called);

  sandbox.restore();
});

test('should use replace unknown variables with their value', (t) => {
  const template = '<html><body><!-- talc:unknown --></body></html>';
  const { mocks, sandbox } = setupCheerio(template);
  const config = {
    dateFormat: 'M/d/yyyy',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(dates, 'format').callThrough();

  convert(config);

  const replace = mocks.cheerioChain.replaceWith.firstCall.args[0];

  t.is(replace(0, { data: 'talc:unknown' }), 'hey yo');

  sandbox.restore();
});

test('should NOT replace a comment with a variable not in the metadata', (t) => {
  const template = '<html><body><!-- talc:unknown --></body></html>';
  const { mocks, sandbox } = setupCheerio(template);
  const config = {
    dateFormat: 'M/d/yyyy',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(dates, 'format').callThrough();

  convert(config);

  const replace = mocks.cheerioChain.replaceWith.firstCall.args[0];

  t.deepEqual(replace(0, { data: 'talc:missing' }), { data: 'talc:missing' });

  sandbox.restore();
});
