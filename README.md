
# Bunjucks

<p align="center">
    <img src="pics/bunjucks.jpeg" style="display: flex; justify-self: center" alt="drawing" width="150"/>
</p>

Create static html static websites with [Nunjucks](https://mozilla.github.io/nunjucks/) (uses [Bun](https://bun.sh/) under the hood). If you know Jinja2 or Nunjucks creating static websites will be a breeze. Of course, you can switch Nunjucks with other templating language you want [doT](https://olado.github.io/doT/), [handlebarsjs](https://handlebarsjs.com/), [ejs](https://ejs.co/), [underscorejs](https://underscorejs.org/) etc.


## Quickstart

- Clone this repository;
- To create a new route/page in the `pages` folder create a new html file. Make sure to name files/folders inside pages url-friendly (letters, numbers, and minus sign `-`).
- `bun run build`: this command will scan `site` folder and compile the static website in `public` folder;
- `bun run dev`: use this command while working on the website for hot reload;
- Run `bun run build` to generate prod static website then `bun run prod` to serve static website in prod; 
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
    ├── index.html   -> / 
    ├── robots.txt   -> /robots.txt  (for SEO)
    └── sitemap.xml  -> /sitemap.xml (for SEO)
```

You have `site` directory which holds the following:
- `assets`: here add your js, css, images or other static files (files: robots.txt, sitemap.xml are used for SEO and file reload.js for hot reload); 
- `layouts`: here add your [base.html](https://mozilla.github.io/nunjucks/templating.html#template-inheritance) aka layouts (each page could have a different layout);
- `macros`: here create [reusable html components](https://mozilla.github.io/nunjucks/templating.html#macro) (partials, widgets, etc) and import them in your layouts or pages.
- `pages`: here add your website main pages, bassically what you see when visiting a web page;


Routes will be created automatically from `pages` directory. 
Filenames and directories will be converted to paths. 
File `index/html` is a bit "special" and will be used for root paths (/).
Files `robots.txt` and `sitemap.xml` are generated automatically from `bunjucks.config.json` and routes. 

In file `bunjucks.config.json` you have the following configuration:
```js
{
    "port": 5173,               // change port if is in use on your machine
    "domain": "localhost:5173", // when ready put here the website domain 
    "use_tailwind": true,       // by default we are using tailwind, but you can turn it off
    "store": {}                 // data you want to pass down to the html templates ({{ store.mydata }})  
}
```

## Deploy to Github Pages

- In github, go to Settings tab look for Pages on the left panel. On Pages, select branch main and folder docs then click save (a github action will run each time you push changes to repo);
- In bunjucks.config.json add what comes after yourgithubusername.github.io/**repo-name** in my case it was /bunjucks: `"domain": "/bunjucks"`;
- While adding links make sure to add the domain prefix to links and static files, like: `href="{{domain}}/etc/route`, `href="{{domain}}/blog"` (you don't need this if you deploy it with `serve` or `bun run prod`); 
- Run `bun run build` and rename `public` folder generated to `docs`;


## Deploy to Netlify

- In bunjucks.config.json keep domain empty like this: `"domain": ""`;
- Run `bun run build` and rename `public` to `netlify`;
- Create a netlify.toml file and add the following configs:
```toml
[build]
  base = "/"
  publish = "netlify/"
```
- Create a Netlify account and point to your github repo containing your static site (like this repo);
- In Netlify dashboard go to `Deploys` and click on `Trigger deploy` dropdown - select `Clear cache and deploy site`;


## Why?

Other static site generators are easy to use if you use a pre-made template, but it gets really hard when you want to create a custom template (tons of configs, you have to go thru tons of documentation, just try to create a custom template and you'll see what I mean). Yes, you could just use html, but it can get messy really quick for big pages/blogs. You write just html with some templating, no markdown, rst, etc. If you want markdown, rst you can use one of the existing static site generators available.
