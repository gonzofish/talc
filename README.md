# Talc

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

| Attribute  | Type     | Purpose                                            | Default Value |
| ---------- | -------- | -------------------------------------------------- | ------------- |
| `input`    | `string` | Directory where posts that will be published live  | `"input"`     |
| `output`   | `string` | Directory where published post will live           | `"output"`    |
| `template` | `string` | The location of an HTML file to place content into | null          |

## Generate a New Markdown File

Talc can create a Markdown file for you with a title:

```shell
$> npm run talc new "My New Post"
```

## Convert to HTML / Publish

To convert all of the Markdown files in the `config.output` directory, run the
following command:

```shell
$> npm run talc publish
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
