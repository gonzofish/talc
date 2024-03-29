const test = require('ava').default;
const sinon = require('sinon');

const path = require('path');
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
          update_date: '2022-02-02 02:22:22',
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
          update_date: '2018-08-03 07:01:30',
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

test('should use the `directory` provided for pages', (t) => {
  const template = '<html><body>my template</body></html>';
  const { sandbox } = setupWithTemplate(template);
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    pages: {
      directory: 'my-directory',
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

  t.true(
    files.readFile.calledWith('my-directory' + path.sep + 'my-template.html'),
  );

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
  sandbox.stub(files, 'readFiles').returns([
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
  sandbox.stub(files, 'writeFiles');

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

test('should compile an listing template if present in the config', (t) => {
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
  sandbox.stub(files, 'readFiles').returns([
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
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 3);

  t.is(fileList[2].contents, compiledIndexTemplate);

  sandbox.restore();
});

test('should allow if blocks to work in a listing template', (t) => {
  const template = templateLoader('loop-template');
  const forIfTemplate = templateLoader('for-if-template');
  const compiledForIfTemplate = templateLoader('compiled-for-if-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    index: 'my-index-template.html',
    pages: {
      templates: [
        {
          filename: 'index.html',
          template: 'my-for-if-template.html',
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
    } else if (filename === 'my-for-if-template.html') {
      return forIfTemplate;
    }
  });
  sandbox.stub(files, 'readFiles').returns([
    {
      contents: `---
title: He is Here
create_date: 2017-11-13 09:30:00
publish_date: 2018-08-03 08:01:00
tags: birth,ben,love
foo: bar
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
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 3);

  t.is(fileList[2].contents, compiledForIfTemplate);

  sandbox.restore();
});

test('should sort files for a listing by a provided sortBy attribute', (t) => {
  const template = templateLoader('loop-template');
  const indexTemplate = templateLoader('index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
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
  sandbox.stub(files, 'readFiles').returns([
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
  sandbox.stub(files, 'writeFiles');

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

test('should ensure that all files can properly use update_date for sorting', (t) => {
  const template = templateLoader('loop-template');
  const indexTemplate = templateLoader('index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          template: 'my-index-template.html',
          sortBy: ['update_date', 'publish_date'],
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
  sandbox.stub(files, 'readFiles').returns([
    {
      contents: `---
title: He is Here
create_date: 2017-11-13 09:30:00
publish_date: 2018-08-03 08:01:00
tags: birth,ben,love
update_date: 2022-01-01 12:34:56
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
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 4);

  // hate having logic like this in tests
  const titles = fileList[3].contents
    // find all of the `<strong />` tags in the index output
    .match(/<strong>[^<]+<\/strong>/g)
    // extract the contents from each `<strong />` tag
    .map((title) => title.replace(/<strong>([^<]+)<\/strong>/, '$1'));

  t.is(titles[0], 'He is Here');
  t.is(titles[1], 'Life is Good!');
  t.is(titles[2], 'Finally!');

  sandbox.restore();
});

test('should allow files to be transformed for a listing template', (t) => {
  const template = templateLoader('loop-template');
  const indexTemplate = templateLoader('index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          sortBy: ['title'],
          template: 'my-index-template.html',
          transformer: (files) => {
            const loveFiles = files.filter(
              ({ tags }) => tags && tags.includes('love'),
            );
            const taglessFiles = files.filter(
              ({ tags }) => !tags || tags.length === 0,
            );

            return [
              {
                filename: 'love.html',
                files: loveFiles,
              },
              {
                filename: 'tagless.html',
                files: taglessFiles,
              },
            ];
          },
          type: 'listing',
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
  sandbox.stub(files, 'readFiles').returns([
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
tags: love
---

Finally out of the old house and into the new!
`,
      filename: 'perfection.md',
    },
  ]);
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 5);
  t.is(fileList[3].filename, 'love.html');
  t.is(fileList[4].filename, 'tagless.html');

  // hate having logic like this in tests
  const getTitles = (index) =>
    fileList[index].contents
      // find all of the `<strong />` tags in the index output
      .match(/<strong>[^<]+<\/strong>/g)
      // extract the contents from each `<strong />` tag
      .map((title) => title.replace(/<strong>([^<]+)<\/strong>/, '$1'));

  const loveTitles = getTitles(3);

  t.is(loveTitles.length, 2);
  t.is(loveTitles[0], 'He is Here');
  t.is(loveTitles[1], 'Life is Good!');

  const taglessTitles = getTitles(4);

  t.is(taglessTitles.length, 1);
  t.is(taglessTitles[0], 'Finally!');

  sandbox.restore();
});

test('should enumerate output files with the same output name if no `filename` is provided', (t) => {
  const indexTemplate = templateLoader('index-template');

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          template: 'index.html',
          sortBy: ['title'],
          type: 'listing',
        },
        {
          template: 'index.html',
          type: 'listing',
        },
      ],
    },
    published: 'published',
  };

  sandbox.stub(files, 'readFile').callsFake((filename) => {
    if (filename === 'index.html') {
      return indexTemplate;
    }
  });
  sandbox.stub(files, 'readFiles').returns([
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
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 5);
  t.is(fileList[3].filename, 'index.1.html');
  t.is(fileList[4].filename, 'index.2.html');

  // hate having logic like this in tests
  const getTitles = (index) =>
    fileList[index].contents
      // find all of the `<strong />` tags in the index output
      .match(/<strong>[^<]+<\/strong>/g)
      // extract the contents from each `<strong />` tag
      .map((title) => title.replace(/<strong>([^<]+)<\/strong>/, '$1'));

  const alphaTitles = getTitles(3);

  t.is(alphaTitles[0], 'Finally!');
  t.is(alphaTitles[1], 'He is Here');
  t.is(alphaTitles[2], 'Life is Good!');

  const publishedTitles = getTitles(3);

  t.is(publishedTitles[0], 'Finally!');
  t.is(publishedTitles[1], 'He is Here');
  t.is(publishedTitles[2], 'Life is Good!');

  sandbox.restore();
});

test('should let a transformer provide its own template', (t) => {
  const derivedTemplate = '<html><body>Custom template</body></html>';

  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          sortBy: ['title'],
          template: 'my-index-template.html',
          transformer: (files) => {
            const loveFiles = files.filter(
              ({ tags }) => tags && tags.includes('love'),
            );

            return [
              {
                filename: 'love.html',
                files: loveFiles,
                template: 'my-derived-template.html',
              },
            ];
          },
          type: 'listing',
        },
      ],
    },
    published: 'published',
  };

  sandbox.stub(files, 'readFile').callsFake((filename) => {
    if (filename === 'my-index-template.html') {
      return '<html></html>';
    } else if (filename === 'my-derived-template.html') {
      return derivedTemplate;
    }
  });
  sandbox.stub(files, 'readFiles').returns([]);
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList.length, 1);

  t.is(fileList[0].contents, `${derivedTemplate}\n`);

  sandbox.restore();
});

test('should let a transformer provide extra metadata', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'yyyy-MM-dd',
    pages: {
      templates: [
        {
          sortBy: ['title'],
          template: 'my-index-template.html',

          transformer: (files) => {
            const loveFiles = files.filter(
              ({ tags }) => tags && tags.includes('love'),
            );

            return [
              {
                filename: 'love.html',
                files: loveFiles,
                metadata: {
                  custom: 'value',
                },
              },
            ];
          },
          type: 'listing',
        },
      ],
    },
    published: 'published',
  };

  sandbox.stub(files, 'readFile').callsFake((filename) => {
    if (filename === 'my-index-template.html') {
      return '<html><body><!-- talc:custom --></body></html>';
    }
  });
  sandbox.stub(files, 'readFiles').returns([]);
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const [, fileList] = files.writeFiles.lastCall.args;

  t.is(fileList[0].contents, '<html><body>value</body></html>\n');

  sandbox.restore();
});

test('should let templates to import other templates', (t) => {
  const partial = 'Date: <!-- talc:publish_date -->';
  const template =
    '<html><body><!-- talc:import:partial.html --> is a date</body></html>';
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
  const { sandbox } = setup();

  sandbox.stub(files, 'readFile').callsFake((filepath) => {
    if (filepath === 'my-template.html') {
      return template;
    } else if (filepath === 'partial.html') {
      return partial;
    }
  });

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);

  t.deepEqual(compiledTemplates, [
    '<html><body>Date: 8/3/2018 is a date</body></html>\n',
    '<html><body>Date: 3/27/2010 is a date</body></html>\n',
    '<html><body>Date: 8/13/2002 is a date</body></html>\n',
  ]);

  sandbox.restore();
});

test('should allow if blocks for conditional rendering', (t) => {
  const template =
    '<html><body><!-- talc:if:[update_date] -->Update date: <!-- talc:update_date --><!-- talc:endif --></body></html>';
  const config = {
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'iffy-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };
  const { sandbox } = setup();

  sandbox.stub(files, 'readFile').callsFake((filepath) => {
    if (filepath === 'iffy-template.html') {
      return template;
    }
  });

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);

  t.deepEqual(compiledTemplates, [
    '<html><body>Update date: 2/2/2022</body></html>\n',
    '<html><body></body></html>\n',
    '<html><body>Update date: 8/3/2018</body></html>\n',
  ]);

  sandbox.restore();
});

test('should allow more complex if blocks', (t) => {
  const template = fixtures.load('if-template');
  const config = {
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'cond-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };
  const { sandbox } = setup();

  files.readFiles.returns(fixtures.load('if-files'));
  sandbox.stub(files, 'readFile').callsFake((filepath) => {
    if (filepath === 'cond-template.html') {
      return template;
    }
  });

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);
  const compiled15 = `<html>
  <body>



  </body>
</html>

`;
  const compiled17 = `<html>
  <body>


      More than 15


      Less than 18





    Not a 15


  </body>
</html>

`;
  const compiled18 = `<html>
  <body>


      More than 15




      Exactly 18



    Not a 15


  </body>
</html>

`;

  t.deepEqual(compiledTemplates, [compiled17, compiled18, compiled15]);

  sandbox.restore();
});

test('should be able to manage assets found in templates and posts', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'post-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };
  const posts = [
    {
      contents: `---
title: Static Uno
publish_date: 2022-10-24 09:25:00
---

![My alt text](%talc:asset:img/some_img.png%)
![](%talc:asset:img/another.gif%)
`,
      filename: 'img_file.md',
    },
  ];
  const template = `<html>
  <head>
    <link rel="stylesheet" href="<!-- talc:asset:css/main.css -->">
  </head>

  <body>
    <img src="<!-- talc:asset:img/banner.jpg -->" title="Site banner" />
    <!-- talc:content -->
  </body>
</html>`;
  const getResult = (content) => `<html>
  <head>
    <link rel="stylesheet" href="css/main.css">
  </head>

  <body>
    <img src="img/banner.jpg" title="Site banner" />
    ${content}
  </body>
</html>\n`;
  const results = [
    getResult(
      '<p><img src="img/some_img.png" alt="My alt text" />\n<img src="img/another.gif" alt="" /></p>',
    ),
  ];

  sandbox.stub(files, 'copyFiles');
  sandbox.stub(files, 'readFiles').returns(posts);
  sandbox.stub(files, 'readFile').callsFake((filepath) => {
    if (filepath === 'post-template.html') {
      return template;
    }
  });
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);
  const copyArgs = files.copyFiles.lastCall.args;

  t.is(compiledTemplates[0], results[0]);
  t.is(copyArgs.length, 3);
  t.is(copyArgs[0], 'built');
  t.deepEqual(copyArgs[1], [
    'css/main.css',
    'img/banner.jpg',
    'img/some_img.png',
    'img/another.gif',
  ]);
  t.is(copyArgs[2], undefined);
  sandbox.restore();
});

test('should locate assets in the specified config.assets directory', (t) => {
  const sandbox = sinon.createSandbox();
  const config = {
    assets: 'static/assets',
    built: 'built',
    dateFormat: 'M/d/yyyy',
    pages: {
      templates: [
        {
          template: 'post-template.html',
          type: 'post',
        },
      ],
    },
    published: 'published',
  };
  const posts = [
    {
      contents: `---
title: Static Uno
publish_date: 2022-10-24 09:25:00
---

![My alt text](%talc:asset:img/some_img.png%)
![](%talc:asset:img/another.gif%)
`,
      filename: 'img_file.md',
    },
  ];
  const template = `<html>
  <head>
    <link rel="stylesheet" href="<!-- talc:asset:css/main.css -->">
  </head>

  <body>
    <img src="<!-- talc:asset:img/banner.jpg -->" title="Site banner" />
    <!-- talc:content -->
  </body>
</html>`;
  const getResult = (content) => `<html>
  <head>
    <link rel="stylesheet" href="css/main.css">
  </head>

  <body>
    <img src="img/banner.jpg" title="Site banner" />
    ${content}
  </body>
</html>\n`;
  const results = [
    getResult(
      '<p><img src="img/some_img.png" alt="My alt text" />\n<img src="img/another.gif" alt="" /></p>',
    ),
  ];

  sandbox.stub(files, 'copyFiles');
  sandbox.stub(files, 'readFiles').returns(posts);
  sandbox.stub(files, 'readFile').callsFake((filepath) => {
    if (filepath === 'post-template.html') {
      return template;
    }
  });
  sandbox.stub(files, 'writeFiles');

  convert(config);

  const written = files.writeFiles.lastCall.args[1];
  const compiledTemplates = written.map(({ contents }) => contents);
  const copyArgs = files.copyFiles.lastCall.args;

  t.is(compiledTemplates[0], results[0]);
  t.deepEqual(copyArgs[1], [
    'static/assets/css/main.css',
    'static/assets/img/banner.jpg',
    'static/assets/img/some_img.png',
    'static/assets/img/another.gif',
  ]);
  t.is(copyArgs[2]('something'), 'something');
  t.is(copyArgs[2]('static/assets/something'), 'something');
  sandbox.restore();
});
