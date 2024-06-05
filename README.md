# Bunjucks

Create static html static websites with [Nunjucks](https://mozilla.github.io/nunjucks/) (uses [Bun](https://bun.sh/) under the hood). If you know Jinja2 or Nunjucks creating static websites will be a breeze. 


## Quickstart

- Clone this repository;
- `bun install` dependencies;
- `bun run dev` when developing (has hot reload);
- HTML static files will be available any time in the `dist` folder;


Folder structure:

```shell
site
├── layouts
│   └── base.html
├── pages
│   ├── about.html  -> /about
│   ├── blog
│   │   ├── how-to-make-a-server.html -> /blog/how-to-make-a-server
│   │   └── index.html -> /blog
│   └── index.html -> /
└── macros
    └── navbar.html
```

You have `site` directory which holds the following:
- `layouts`: here add your base.html aka layouts (each page could have a different layout);
- `pages`: here add your website pages (routes will be created from this folder see pages structure above);
- `macros`: here create [reusable html components](https://mozilla.github.io/nunjucks/templating.html#macro) (partials, widgets, etc) and import them in your layouts or pages.

Routes will be created automatically from `pages` directory. Filenames and dirs will be converted to paths. File `index/html` is a bit "special" and will be used for root paths (/). Only one nested folder is allowed (see blog folder).


## Why?

Other static site generators are easy to use if you use a premade template, but it gets really hard when you want to create a custom template (tons of configs, you have to go thru tons of documentation, just try to create a custom template and you'll see what I mean).

Yes you could just use html, but it can get messy really quick for big pages/blogs. Using this approach you can convert the static site into a dynamic one. 

You write just html with jinja/nunjucks templating, no markdown, rst, etc. you can use one of the existing SSG available for that.
