const test = require('ava').default;
const sinon = require('sinon');

const showdown = require('showdown');

const convert = require('../../lib/operators/convert');
const dates = require('../../lib/utils/dates.util');
const files = require('../../lib/utils/files.util');

const fixtures = require('./fixtures');

const setupWithTemplate = (template) => {
  const { sandbox } = setup();

  sandbox.stub(files, 'readFile').returns(template);

  return {
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
    dateFormat: 'YYYY-MM-dd HH:mm:ss',
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
  const { sandbox } = setupWithTemplate(template);
  const config = {
    dateFormat: 'YYYY-MM-dd HH:mm:ss',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  convert(config);

  t.true(files.readFile.calledWith('my-template.html'));

  sandbox.restore();
});

test('should replace variables', (t) => {
  const template = '<html><body><!-- talc:publish_date --></body></html>';
  const { sandbox } = setupWithTemplate(template);
  const config = {
    dateFormat: 'M/d/yyyy',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(dates, 'format').callThrough();

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);

  t.true(dates.format.called);
  t.deepEqual(compiledTemplates, [
    '<html><body>8/3/2018</body></html>\n',
    '<html><body>3/27/2010</body></html>\n',
    '<html><body>8/13/2002</body></html>\n',
  ]);

  sandbox.restore();
});

test('should replace missing variables with a blank', (t) => {
  const template = '<html><body><!-- talc:unknown --></body></html>';
  const { sandbox } = setupWithTemplate(template);
  const config = {
    dateFormat: 'M/d/yyyy',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(dates, 'format').callThrough();

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);

  t.deepEqual(compiledTemplates, [
    '<html><body>hey yo</body></html>\n',
    '<html><body></body></html>\n',
    '<html><body></body></html>\n',
  ]);

  sandbox.restore();
});

test('should be able to use nested for loops', (t) => {
  const template = fixtures.load('loop-template');
  const compiledTemplate = fixtures.load('compiled-loop-template');

  const sandbox = sinon.createSandbox();
  const config = {
    dateFormat: 'yyyy-MM-dd',
    input: 'input',
    output: 'output',
    template: 'my-template.html',
  };

  sandbox.stub(files, 'readFile').returns(template);
  sandbox.stub(files, 'readFiles').returns(fixtures.load('files'));
  sandbox.stub(files, 'writeFiles');

  files.readFiles.returns([
    {
      contents: `---
title: I Have Tags
create_date: 2017-11-13 09:30:00
publish_date: 2018-08-03 08:01:00
tags: birth,ben,love
---

My boy was born today!
`,
      filename: 'birth.md',
    },
  ]);

  convert(config);

  t.deepEqual(files.writeFiles.lastCall.args, [
    'output',
    [
      {
        contents: compiledTemplate,
        filename: 'i-have-tags.html',
        metadata: {
          create_date: '2017-11-13',
          title: 'I Have Tags',
          publish_date: '2018-08-03',
          tags: ['birth', 'ben', 'love'],
        },
      },
    ],
  ]);

  sandbox.restore();
});
