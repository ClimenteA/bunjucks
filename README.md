
# Bunjucks

<p align="center">
    <img src="bunjucks.jpeg" style="display: flex; justify-self: center" alt="drawing" width="150"/>
</p>

Create static html static websites with [Nunjucks](https://mozilla.github.io/nunjucks/) (uses [Bun](https://bun.sh/) under the hood). If you know Jinja2 or Nunjucks creating static websites will be a breeze. Of course, you can switch Nunjucks with other templating language you want [doT](https://olado.github.io/doT/), [handlebarsjs](https://handlebarsjs.com/), [ejs](https://ejs.co/), [underscorejs](https://underscorejs.org/) etc.


## Quickstart

- Clone this repository;
- To create a new route/page in the `pages` folder create a new html file. Make sure to name files/folders inside pages url-friendly (letters, numbers, and minus sign `-`).
- `bun run index.ts`: this command will scan `site` folder and compile the static website in `public` folder;
- `DEV=on bun run index.ts`: use this command while working on the website for hot reload;
- Run `bun run index.ts` to generate prod static website then `DEV=off bun run index.ts` to serve static website in prod; 
- To serve static website generated you could use [serve package from vercel](https://www.npmjs.com/package/serve) using this command `serve -l 5173` from inside public folder;


Folder structure:

```shell
site
├── assets
│   ├── bunjucks.jpeg -> /assets/bunjucks.jpeg
│   ├── reload.js     -> /assets/reload.js (when DEV=on)
│   ├── styles.css    -> /assets/styles.css 
│   └── tailwind.css  ignored
├── layouts
│   └── base.html
├── macros
│   └── navbar.html
└── pages
    ├── about.html                      -> /about
    ├── blog                            
    │   ├── how-to-make-pancakes.html   -> /blog/how-to-make-pancakes
    │   └── index.html                  -> /blog 
    └── index.html                      -> / 
```

You have `site` directory which holds the following:
- `assets`: here add your js, css, images or other static files (files: robots.txt, sitemap.xml are used for SEO and file reload.js for hot reload); 
- `layouts`: here add your [base.html](https://mozilla.github.io/nunjucks/templating.html#template-inheritance) aka layouts (each page could have a different layout);
- `macros`: here create [reusable html components](https://mozilla.github.io/nunjucks/templating.html#macro) (partials, widgets, etc) and import them in your layouts or pages.
- `pages`: here add your website main pages, bassically what you see when visiting a web page;


Routes will be created automatically from `pages` directory. 
Filenames and directories will be converted to paths. 
File `index/html` is a bit "special" and will be used for root paths (/).

In file `bunjucks.config.json` you have the following configuration:
```js
{
    "port": 5173,               // change port if is in use on your machine
    "domain": "localhost:5173", // when ready put here the website domain 
    "use_tailwind": true,       // by default we are using tailwind, but you can turn it off
    "store": {}                 // data you want to pass down to the html templates ({{ store.mydata }})  
}
```



## Why?

Other static site generators are easy to use if you use a pre-made template, but it gets really hard when you want to create a custom template (tons of configs, you have to go thru tons of documentation, just try to create a custom template and you'll see what I mean). Yes, you could just use html, but it can get messy really quick for big pages/blogs. You write just html with some templating, no markdown, rst, etc. If you want markdown, rst you can use one of the existing static site generators available.
