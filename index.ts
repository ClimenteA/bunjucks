import path from "path"
import fs from "fs/promises"
import { readdir } from "fs/promises"
import nunjucks from "nunjucks"


let CONFIG_PATH = "./bunjucks.config.json"

interface Config {
    port: number
    domain: string
    debug: boolean
    store?: any
}

async function makeConfig(){
    let defaultConfig: Config = {
        port: 5173,
        domain: "localhost:5173",
        debug: true
    }
    Bun.write(CONFIG_PATH, JSON.stringify(defaultConfig , null, 4))
    return defaultConfig
}

async function getConfig(){
    let file = Bun.file(CONFIG_PATH)
    let config: Config = await file.json()
    return config
}

async function makeDirs() {
    await fs.mkdir("./site/assets", {recursive: true})
    await fs.mkdir("./site/layouts", {recursive: true})
    await fs.mkdir("./site/macros", {recursive: true})
    await fs.mkdir("./site/pages", {recursive: true})
}

async function makeReadMeFile() {

    let readmeContents = `
# Bunjucks

Create custom static websites fast.

- \`bun install\` - to install dependencies;
- \`bun dev\` - to run site with hot reload while you are working on it;
- \`bun build\` - to create index.html export;

    `
    Bun.write("./Readme.md", readmeContents)
}

async function makePackageJson() {

    let defaultPackageJson = {
        "name": "bunjucks",
        "description": "Create html static sites with Bun and Nunjucks",
        "module": "index.ts",
        "type": "module",
        "scripts": {
          "build": "concurrently \"npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css\" \"bun build ./index.ts --compile --outfile ./website/server\" \"BUILD=1 bun index.ts\"",
          "dev": "concurrently \"bun --watch index.ts\" \"npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css --watch\""
        },
        "devDependencies": {
          "@types/bun": "latest",
          "tailwindcss": "^3.4.3"
        },
        "peerDependencies": {
          "typescript": "^5.0.0"
        },
        "dependencies": {
          "@types/nunjucks": "^3.2.6",
          "concurrently": "^8.2.2",
          "nunjucks": "^3.2.4"
        }
      }

    Bun.write("./package.json", JSON.stringify(defaultPackageJson , null, 4))
    
}

async function makeReloadJs() {

    let reloadJsContent = `
document.addEventListener('DOMContentLoaded', (event) => {
    let intervalId = setInterval(async () => {
        try {
            let response = await fetch('http://localhost:{{ port }}/__reload')
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`)
            }
            let data = await response.text()
            if (data === "Reload true") {
                clearInterval(intervalId)
                location.reload()
            }
        } catch (error) {
            console.error('Fetch error:', error)
            clearInterval(intervalId)
        }
    }, 800)
})
`
    Bun.write("./site/assets/reload.js", reloadJsContent)

}

async function makeCSSFiles() {
    let tailwindCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`
    Bun.write("./site/assets/tailwind.css", tailwindCss)
    Bun.write("./site/assets/styles.css", "/* Here tailwind will compute css */")

}

async function makeTailwindConfigFile() {
    let tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./site/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    Bun.write("./tailwind.config.js", tailwindConfig)
}


async function makeTsConfigJson() {
    let tsconfig = {
        "compilerOptions": {
          "lib": ["ESNext", "DOM"],
          "target": "ESNext",
          "module": "ESNext",
          "moduleDetection": "force",
          "jsx": "react-jsx",
          "allowJs": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "noEmit": true,
          "strict": true,
          "skipLibCheck": true,
          "noFallthroughCasesInSwitch": true,
          "noUnusedLocals": false,
          "noUnusedParameters": false,
          "noPropertyAccessFromIndexSignature": false
        }
    }

    Bun.write("./tsconfig.json", JSON.stringify(tsconfig, null, 4))
      
}

async function serveConfig() {
    let serveContent = {
        "cleanUrls": true
    }
    Bun.write("./serve.json", JSON.stringify(serveContent, null, 4))
}


async function collectFiles() {
    
    let cfg = await getConfig()
    let filepaths = await readdir("./site", { recursive: true })

    for (let fp of filepaths) {

        let relPath = "./site/" + fp
        if ((await fs.lstat(relPath)).isDirectory()) continue
        if (fp == "assets/tailwind.css") continue
        
        if (fp.startsWith("pages")) {
            let publicPath = "./public/" + fp.split("/").splice(1,).join("/")
            await fs.mkdir(path.dirname(publicPath), { recursive: true })
            await fs.writeFile(publicPath, nunjucks.render(fp, { port: cfg.port, debug: cfg.debug, store: cfg.store }))
        } 
        
        if (fp.startsWith("assets")) {
            
            if (fp.endsWith(".js")) {
                let publicPath = "./public/" + fp
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                await fs.writeFile(publicPath, nunjucks.render(fp, { port: cfg.port, debug: cfg.debug, store: cfg.store }))
            } else {
                let publicPath = "./public/" + fp
                let bunFile = Bun.file(relPath)
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                await Bun.write(publicPath, bunFile)
            }
        } 
    }

}

async function makeDefaultSite() {
    
    nunjucks.configure('site', { autoescape: true })

    await collectFiles()


    // assets: []CollectedPath = assetsFiles.map(item => {nun: `assets/${item}`, relPath: `./site/assets/${item}`})

    // let layoutsFiles = await readdir("./site/layouts", { recursive: true })
    // layouts = layoutsFiles.map(item => `layouts/${item}`)

    // let macrosFiles = await readdir("./site/macros", { recursive: true })
    // macros = macrosFiles.map(item => `macros/${item}`)

    // let pagesFiles = await readdir("./site/pages", { recursive: true })
    // pages = pagesFiles.map(item => `pages/${item}`)

    // console.log("\nFiles:")
    // console.log("assets:", assets)
    // console.log("layouts:", layouts)
    // console.log("macros:", macros)
    // console.log("pages:", pages)

    // await fs.mkdir("./public/assets", {recursive: true})

    // fs.copyFile()


}

async function initialize() {
    // await makeConfig()
    // await makeDirs()
    // await makeReadMeFile()
    // await makePackageJson()
    // await makeReloadJs()
    // await makeCSSFiles()
    // await makeTailwindConfigFile()
    // await makeTsConfigJson()
    // await serveConfig()

    await makeDefaultSite()

    return ""
    
// `
// Nice 😁

// Next, run the followind commands:
// - bun install;
// - bun dev;
// `
}

initialize().then(res => console.log(res))
