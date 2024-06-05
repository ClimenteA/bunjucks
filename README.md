# Bunjucks

Create static html static websites with [Nunjucks](https://mozilla.github.io/nunjucks/) (uses [Bun](https://bun.sh/) under the hood). If you know Jinja2 or Nunjucks creating static websites will be a breeze. Of course, you can switch Nunjucks with other templating language you want [doT](https://olado.github.io/doT/), [handlebarsjs](https://handlebarsjs.com/), [ejs](https://ejs.co/), [underscorejs](https://underscorejs.org/) etc.


## Quickstart

- Clone this repository;
- `bun install` dependencies;
- `bun run dev` when developing (has hot reload);
- `bun run build` to create the static website from templates;


Folder structure:

```shell
site
├── assets
│   ├── reload.js    -> /assets/reload.js
│   ├── robots.txt   -> /robots.txt
│   └── sitemap.xml  -> /sitemap.xml
├── layouts
│   └── base.html
├── macros
│   └── navbar.html
└── pages
    ├── about.html   -> /about
    ├── blog
    │   ├── how-to-make-a-server.html -> /blog/how-to-make-a-server
    │   └── index.html -> /blog
    └── index.html     -> /
```

You have `site` directory which holds the following:
- `assets`: here add your js, css, images or other static files, directories will be ignored (files: robots.txt, sitemap.xml are used for SEO and file reload.js for hot reload); 
- `layouts`: here add your [base.html](https://mozilla.github.io/nunjucks/templating.html#template-inheritance) aka layouts (each page could have a different layout);
- `pages`: here add your website main pages, bassically what you see when visiting a website;
- `macros`: here create [reusable html components](https://mozilla.github.io/nunjucks/templating.html#macro) (partials, widgets, etc) and import them in your layouts or pages.


Routes will be created automatically from `pages` directory. Filenames and dirs will be converted to paths. File `index/html` is a bit "special" and will be used for root paths (/). Only one nested folder is allowed (see blog folder).


## Why?

Other static site generators are easy to use if you use a pre-made template, but it gets really hard when you want to create a custom template (tons of configs, you have to go thru tons of documentation, just try to create a custom template and you'll see what I mean). Yes, you could just use html, but it can get messy really quick for big pages/blogs. You write just html with some templating, no markdown, rst, etc. If you want markdown, rst you can use one of the existing static site generators available.
