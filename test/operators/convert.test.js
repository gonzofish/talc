const test = require('ava').default;
const sinon = require('sinon');

const showdown = require('showdown');

const convert = require('../../lib/operators/convert');
const dates = require('../../lib/utils/dates.util');
const files = require('../../lib/utils/files.util');

const fixtures = require('./fixtures');
const templateLoader = require('./fixtures/template-loader');

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
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    pages: { templates: [] },
    published: 'published',
  };

  convert(config);

  t.true(showdown.Converter.calledWith({ metadata: true }));
  t.true(files.readFiles.calledWith('published', 'md'));
  t.true(
    files.writeFiles.calledWith('built', [
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
          create_date: '1984-08-13 02:30:00',
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
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    pages: {
      templates: [
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };

  convert(config);

  t.true(files.readFile.calledWith('my-template.html'));

  sandbox.restore();
});

test('should replace variables', (t) => {
  const template = '<html><body><!-- talc:publish_date --></body></html>';
  const { sandbox } = setupWithTemplate(template);
  const config = {
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
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
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
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
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
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
    'built',
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

test('should compile an index template if present in the config', (t) => {
  const template = templateLoader('loop-template');
  const indexTemplate = templateLoader('index-template');
  const compiledIndexTemplate = templateLoader('compiled-index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    index: 'my-index-template.html',
    pages: {
      templates: [
        {
          filename: 'index.html',
          template: 'my-index-template.html',
          sortBy: ['publish_date'],
          type: 'listing',
        },
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };

  sandbox.stub(files, 'readFile').callsFake((filename) => {
    if (filename === 'my-template.html') {
      return template;
    } else if (filename === 'my-index-template.html') {
      return indexTemplate;
    }
  });
  sandbox.stub(files, 'readFiles').returns(fixtures.load('files'));
  sandbox.stub(files, 'writeFiles');

  files.readFiles.returns([
    {
      contents: `---
title: He is Here
create_date: 2017-11-13 09:30:00
publish_date: 2018-08-03 08:01:00
tags: birth,ben,love
---

My boy was born today!
`,
      filename: 'birth.md',
    },
    {
      contents: `---
title: Finally!
publish_date: 2018-08-10 04:23:00
---

Sue has no headache...finally...
`,
      filename: 'finally.md',
    },
  ]);

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 3);

  t.is(fileList[2].contents, compiledIndexTemplate);

  sandbox.restore();
});

test('should sort index files by the provided sortBy config attribute', (t) => {
  const template = templateLoader('loop-template');
  const indexTemplate = templateLoader('index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          filename: 'index.html',
          template: 'my-index-template.html',
          sortBy: ['title'],
          type: 'listing',
        },
        {
          template: 'my-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };

  sandbox.stub(files, 'readFile').callsFake((filename) => {
    if (filename === 'my-template.html') {
      return template;
    } else if (filename === 'my-index-template.html') {
      return indexTemplate;
    }
  });
  sandbox.stub(files, 'readFiles').returns(fixtures.load('files'));
  sandbox.stub(files, 'writeFiles');

  files.readFiles.returns([
    {
      contents: `---
title: He is Here
create_date: 2017-11-13 09:30:00
publish_date: 2018-08-03 08:01:00
tags: birth,ben,love
---

My boy was born today!
`,
      filename: 'birth.md',
    },
    {
      contents: `---
title: Finally!
publish_date: 2018-08-10 04:23:00
---

Sue has no headache...finally...
`,
      filename: 'finally.md',
    },
    {
      contents: `---
title: Life is Good!
publish_date: 2019-04-01 10:30:00
---

Finally out of the old house and into the new!
`,
      filename: 'perfection.md',
    },
  ]);

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 4);

  // hate having logic like this in tests
  const titles = fileList[3].contents
    // find all of the `<strong />` tags in the index output
    .match(/<strong>[^<]+<\/strong>/g)
    // extract the contents from each `<strong />` tag
    .map((title) => title.replace(/<strong>([^<]+)<\/strong>/, '$1'));

  t.is(titles[0], 'Finally!');
  t.is(titles[1], 'He is Here');
  t.is(titles[2], 'Life is Good!');

  sandbox.restore();
});
