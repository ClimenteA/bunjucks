# Bunjucks

Create static html static websites with [Nunjucks](https://mozilla.github.io/nunjucks/) (uses [Bun](https://bun.sh/) under the hood).
If you know Jinja2 or Nunjucks creating static websites will be a breeze. 


## Quickstart

- Clone this repository;
- `bun install` dependencies;
- `bun run dev` while developing (has hot reload);
- Optional: [install this vscode extension for nunjuks](https://github.com/ronnidc/vscode-nunjucks)
- HTML static files will be available any time in the `dist` folder;


Folder structure:

```shell
site
├── layouts
│   └── base.nj
├── pages
│   ├── about.nj  -> /about
│   ├── blog
│   │   ├── how-to-make-a-server.nj -> /blog/how-to-make-a-server
│   │   └── index.nj -> /blog
│   └── index.nj -> /
└── partials
    └── navbar.nj
```

You have `site` directory which holds the following:
- `layouts`: here add your base.html (or base.nj if you are using the nunjucks extension);
- `pages`: here add your website pages (name of file will be the route);
- `partials`: here create reusable html components (macros, widgets, etc) and import them in your layouts or pages.

Routes will be created automatically from `pages` directory. Only one nested folder is allowed (see blog folder).


## Why?

It you are not using a default template is pretty hard to create a custom template from scratch.
It's simpler than other static sites generators (hugo, astro, jekyll etc). You just need to learn nunjucks (if you know jinja you know too much already). No more configs, CLI commands, searching for the perfect template. Split html components in partials, layouts to make it easier to build big html pages. Add your custom functionality with Bun and Typescript.

