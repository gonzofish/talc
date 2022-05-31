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
| `dateFormat` | `string`        | The [date-fns formats](https://date-fns.org/docs/format) to use                                                | `"yyyy-MM-dd HH:mm:ss"` |
| `drafts`     | `string`        | Directory where draft posts live                                                                               | `"drafts"`              |
| `pages`      | `Pages`         | The different pages to render and (optionally) the directory where they live                                   | `{ templates: [] }`     |
| `published`  | `string`        | Directory where posts that will be compiled live                                                               | `"published"`           |
| `updating`   | `string`        | Directory where updating posts should reside                                                                   | `"updating"`            |

### The Pages Config

The pages that will be created rely on templates which can be provided by the `pages` attribute of `talc.config.js`. There are two attributes:

|Attribute|Type|Purpose|Default Value|
|---|---|---|---|
|`directory`|`string`|The directory where the templates live|`undefined`|
|`partials`|`string`|The directory where partial templates live|`undefined`|
|`templates`|`Array<Template>`|The list of templates to create|`[]`|

Each `Template` can have the following attributes:

|Attribute|Type|Purpose|Default Value|
|---|---|---|---|
|`sortBy`|`Array<string>`|A list of metadata variables to sort by; only applies to `"listing"` templates|`["publish_date"]`|
|`template`|`string`|The filename of the source template|N/A; _required_|
|`transformer`|`Function`|A way of pre-processing a template; only applies to `"listing"` templates|`(files, template) => [{ filename: template.filename, files }]`|
|`type`|`"listing"\|"post"`|The filename of the source template|`"post"`|

#### Transformers

> More than meets the eye!

A transformer allows the processing of a template to add metadata or even return multiple templates.

The function signature for a transformer is:

```typescript
(files: Array<File>, template: Template) => Array<TransformedFile>
```

The input parameters are:

|Attribute|Type|Purpose|
|---|---|---|
|`files`|`Array<File>`|The list of process `"post"` files|
|`template`|`Template`|The original template|

Each `File` will contain the file's filename and any metadata coming from the original markdown file.

A `TransformedFile` can have the following attributes:

|Attribute|Type|Purpose|Required?|
|---|---|---|---|
|`filename`|`string`|A new filename to use for the derived file||
|`files`|`Array<File>`|The files to use when processing the template|:+1:|
|`metadata`|`Object`|Any additional metadata to use on the template||
|`template`|`string`|An alternative template to use||

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

## Update a Published File

Talc will keep a published file around while you want to update it by putting a copy in `updating`. When you're done, it will append an `update_date` to the file's metadata and overwrite the previous version in `published`. This means there is a two-step process for updating.

1. Start updating a published file:
    ```shell
    > npm run talc update start file-to-update
    ```
2. When all of the updates have been made, to commit those updates, run:
    ```shell
    > npm run talc update finish file-to-update
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
the content should go put a comment with `talc:content` in it:

```html
<html>
  <head>
    <title>My Template</title>
  </head>

  <body>
    <div class="content">
      <!-- talc:content -->
    </div>
  </body>
</html>
```

### Template Partials

Sometimes we have HTML that we use over and over again. For instance, the
header of your page might be the same text on every page. Instead of adding
that HTML to every template, you can leverage template partials to make
reusable code.

You could break up your reusable content into separate, reusable partials:

```html
<!-- templates/header.html -->
<html>
  <head>
    <title>My Template</title>

    <link rel="stylesheet" href="styles/my-styles.css">
  </head>

  <body>
    <header>
      <h1>My Awesome Page!</h1>
    </header>

    <div class="content">
```

```html
<!-- templates/footer.html -->
    </div>

    <footer>
      (C) 1981, Awesome Page Inc.
    </footer>
  </body>
</html>
```

And then, in your actual content templates, reference those templates, by using
`talc:import:<template>`, to have them compiled when publishing:

```html
<!-- templates/post.html -->
<!-- talc:import:header.html -->
<!-- talc:content -->
<!-- talc:import:footer.html -->
```

Combining templates, partials, and variables (see below) allows minimal code
while allowing for multiple page formats.

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
| `create_date`  | Specify the date the content was created; Talc will use the `dateFormat` config attribute to format the output of this attribute                |           |           |
| `files`        | Only available to a `"listing"` template, this provides an array of file metadata including the `filename` and any data for that file           |           | :+1:      |
| `publish_date` | Specify the date the content moves to a published state; Talc will use the `dateFormat` config attribute to format the output of this attribute | :+1:      |           |
| `title`        | The title of the content                                                                                                                        | :+1:      |           |
| `update_date`  | The date the file was last update; only present if the file has been through the `update` process                                               |           | :+1:      |

## Loops & Listing Templates

As the example above shows, Talc supports the use of a very simple `for`/`endfor` looping construct. The basic syntax is:

```html
<!-- talc:for:{variable name} -->
...do some stuff here...
<!-- talc:endfor -->
```

The metadata of a markdown file only supports very simple lists, so any metadata
array should use `<!-- talc:content -->` to output the value at each index of
that array.

For the special variable `files` (which is only available to a `"listing"`
template), Talc will provide all of the metadata and `filename` for each file
in the array. Those metadata & `filename` can be used as output just by
referencing their variable name. So to output a list of all filenames and their publish dates, you could write an `"listing"` template like:

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

## Conditional Logic in Templates

Simple conditional logic is also possible in templates. All conditions must be compared against a template metadata value. The basic syntax is:

```html
<!-- talc:if:[condition] -->
...do some stuff if condition is truthy
<!-- talc:endif -->
```

> IMPORTANT: the square brackets (`[]`) around the condition must be present for the condition to be properly parsed and evaluated.

Conditions are simple equations of one of two forms the form:

```
variable
```

In this form, Talc just checks that the variable is truthy and, if it is, will render the contents within the conditional.

```
lhs op rhs
```

In this form, `op` is one of the following operators:

* `===` - strict equals
* `!==` - strict not-equals
* `>` - greater-than
* `>=` - greater-than or equals
* `<` - less-than
* `<=` - less-than or equals

Either the lefthand-side (`lhs`) and right-hand side (`rhs`) of the equation must be a metadata variable and the other must be a value. That means all of the following are valid:

```
published_date >= '2020-01-01'
'2020-01-01' < created_date
title !== 'This is a fake title'
```

While the following are _not_ valid:

```
published_date < crated_date
'alpha' !== 'beta'
```
