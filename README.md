# Talc

[![codecov](https://codecov.io/gh/gonzofish/talc/branch/master/graph/badge.svg)](https://codecov.io/gh/gonzofish/talc)

Talc is my experiment to create blog posts from Markdown files and, eventually,
a static site.

# How to Use

## Add an NPM Task

In your `package.json` add:

```json
{
  "scripts": {
    "talc": "talc"
  }
}
```

## Create a Talc Config

Talc looks for a `talc.config.js` file next to your `package.json`. It
understands the following attributes:

| Attribute    | Type            | Purpose                                                                                                        | Default Value           |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `built`      | `string`        | Directory where compiled post will live                                                                        | `"built"`               |
| `dateFormat` | `string`        | The [Luxon date format](https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens) to use | `"yyyy-MM-dd HH:mm:ss"` |
| `drafts`     | `string`        | Directory where draft posts live                                                                               | `"drafts"`              |
| `index`      | `string`        | A special template for creating an index of all output files                                                   | `null`                  |
| `published`  | `string`        | Directory where posts that will be compiled live                                                               | `"published"`           |
| `sortBy`     | `Array<string>` | The metadata fields to sort posts by in the index file                                                         | [`publish_date`]        |
| `template`   | `string`        | The location of an HTML file to place content into                                                             | `null`                  |

## Generate a New Markdown File

Talc can create a Markdown file for you with a title:

```shell
$> npm run talc new "My New Post"
# or
$> npm run talc n "My New Post"
```

## Publish a File

Talc will append a `publish_date` and move your file to the `published` directory
from the `drafts` directory:

```shell
$> npm run talc publish my-file
# or
$> npm run talc p my-file
```

Notes:

1. If a file has no metadata boundaries (`---`) it'll be silently skipped
2. If a file has multiple `publish_date` attributes, the last in the list of
   metadata is the one used

## Convert to HTML

To convert all of the Markdown files in the `config.output` directory, run the
following command:

```shell
$> npm run talc build
# or
$> npm run talc b
```

## Using a Template File

In order to place content into a template, create any HTML document and, where
the content should go put a comment with `talc-content` in it:

```html
<html>
  <head>
    <title>My Template</title>
  </head>

  <body>
    <div class="content">
      <!-- talc-content -->
    </div>
  </body>
</html>
```

## Metadata & Variables

Talc supports the use of Markdown metadata to allow you to leverage that metadata
as variables in your templates.

For a post like:

```markdown
---
title: My Boy is Born!
publish_date: 2018-08-03 08:01:00
tags: birth,baby,happy
---

Today was a glorious day! My son was born!
```

And a template like:

```html
<html>
  <head>
    <title>Post: <!-- talc:title --></title>
  </head>

  <body>
    <h1><!-- talc:title --></h1>
    <span class="dateline"><!-- talc:publish_date --></span>

    <!-- talc:content -->

    <ul class="tags">
      <!-- talc:for:tags -->
      <li><!-- talc:content --></li>
      <!-- talc:endfor -->
    </ul>
  </body>
</html>
```

The output file would look like:

```html
<html>
  <head>
    <title>Post: My Boy is Born!</title>
  </head>
  <body>
    <h1>My Boy is Born!</h1>
    <span class="dateline">8/13/2018</span>
    <p>
      Today was a glorious day! My son was born!
    </p>
    <ul class="tags">
      <li>birth</li>
      <li>baby</li>
      <li>happy</li>
    </ul>
  </body>
</html>
```

### Special Metadata/Variables

Talc has a small set of special, known metadata. The provided variables will not
be recognized if placed in metadata.

| Variable       | Purpose                                                                                                                                         | Required? | Provided? |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| `content`      | This outputs any text content; if in a loop it'll output the value at the current index                                                         |           | :+1:      |
| `create_date`  | Specify the date the content was created; Talc will use the `dateFormat` config attribute to format the output of this attribute                |
| `files`        | Only available to an `index` template, this provides an array of file metadata including the `filename` and any data for that file              |           | :+1:      |
| `publish_date` | Specify the date the content moves to a published state; Talc will use the `dateFormat` config attribute to format the output of this attribute | :+1:      |
| `title`        | The title of the content                                                                                                                        | :+1:      |

## Loops & Index Templates

As the example above shows, Talc supports the use of a very simple `for`/`endfor` looping construct. The basic syntax is:

```html
<!-- talc:for:{variable name} -->
...do some stuff here...
<!-- talc:endfor -->
```

The metadata of a markdown file only supports very simple lists, so any metadata
array should use `<!-- talc:content -->` to output the value at each index of
that array.

For the special variable `files` (which is only available to an `index`
template), Talc will provide all of the metadata and `filename` for each file
in the array. Those metadata & `filename` can be used as output just by
referencing their variable name. So to output a list of all filenames and their publish dates, you could write an index template like:

```html
<ul>
  <!-- talc:for:files -->
  <li>
    <!-- talc:filename -->
    (<!-- talc:publish_date -->)
  </li>
  <!-- talc:endfor -->
</ul>
```

This template just loops through files and, for each value in the `files` array, uses the `filename` and `publish_date` metadata attributes to fill in the content.

If you had a `tags` metadata on some (or all) of your posts that you wanted to output, you could create a nested loop and use `talc:content` to output the value of each value in the `tags` array:

```html
<ul>
  <!-- talc:for:files -->
  <li>
    <!-- talc:filename -->
    (<!-- talc:publish_date -->)
    <div class="tags">
      <!-- talc:for:tags -->
      <div class="tag"><!-- talc:content --></div>
      <!-- talc:endfor -->
    </div>
  </li>
  <!-- talc:endfor -->
</ul>
```
