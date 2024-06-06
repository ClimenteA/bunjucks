import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import { watch } from "fs"
import { readdir } from "fs/promises"
import nunjucks from "nunjucks"

let PORT = 5173
let DOMAIN = "localhost:5173"
let CONFIG_PATH = "./bunjucks.config.json"
let routes: {[key: string]: string } = {}

interface Config {
    port: number
    domain: string
    debug: boolean
    store?: any
}

async function getConfig(){
    let file = Bun.file(CONFIG_PATH)
    let config: Config = await file.json()
    return config
}

async function buildStaticSite() {
    
    let cfg = await getConfig()
    PORT = cfg.port
    DOMAIN = cfg.domain

    let filepaths = await readdir("./site", { recursive: true })
    nunjucks.configure('site', { autoescape: true })

    let publicPaths = []
    for (let fp of filepaths) {

        let relPath = "./site/" + fp
        if ((await fs.lstat(relPath)).isDirectory()) continue
        if (fp == "assets/tailwind.css") continue
        
        if (fp.startsWith("pages")) {
            let publicPath = "./public/" + fp.split("/").splice(1,).join("/")
            await fs.mkdir(path.dirname(publicPath), { recursive: true })
            await fs.writeFile(publicPath, nunjucks.render(fp, { port: cfg.port, debug: cfg.debug, store: cfg.store }))
            publicPaths.push(publicPath)
        } 
        
        if (fp.startsWith("assets")) {
            if (fp.endsWith(".js")) {
                let publicPath = "./public/" + fp
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                await fs.writeFile(publicPath, nunjucks.render(fp, { port: cfg.port, debug: cfg.debug, store: cfg.store }))
                publicPaths.push(publicPath)
            } else {
                let publicPath = "./public/" + fp
                let bunFile = Bun.file(relPath)
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                await Bun.write(publicPath, bunFile)
                publicPaths.push(publicPath)
            }
        } 
    }

    let servefp = "./public/serve.json"
    if(!await fs.exists(servefp)) {
        Bun.write(servefp, JSON.stringify({cleanUrls: true}, null, 4))
    }

    for (let p of publicPaths){
        if (p.endsWith("index.html")) {
            let r = p.replace("./public", "").replace("/index.html", "")
            if (r == "") r = "/"
            routes[r] = p
        } else {
            let r = p.replace("./public", "").replace(".html", "")
            routes[r] = p
        }
    }

    return "Static site was built!"

}

async function tailwindReload() {
    await $`npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css`.text()
    return "CSS refreshed!"
}

async function refreshStaticSite(filename: string) {
    let start = performance.now()

    if (filename.endsWith(".html") || filename.endsWith(".css") || filename.endsWith(".js")) {
        await tailwindReload()
        await buildStaticSite()
    }

    return `Recreated site in ${(performance.now() - start).toFixed(2)} ms`
}

function main(){

    if (process.env.DEBUG == undefined) {
        buildStaticSite().then(res => console.log(res))
        return
    }

    let firstRender = true
    let filesChanged = true

    Bun.serve({
        async fetch(req) {

            const url = new URL(req.url)

            if (url.pathname.includes("__reload")) {
                if (filesChanged == true) {
                    filesChanged = false
                    return new Response("Reload true")
                } else {
                    return new Response("Reload false")
                }
            }

            if (routes[url.pathname]) {
                return new Response(Bun.file(routes[url.pathname]))
            }

            return new Response("Page does not exist!")
        },
        development: true,
        port: PORT,
    })

    if (firstRender){
        refreshStaticSite("index.html").then(res => {
            firstRender = false
            console.log(res.replace("Recreated", "Created"))
        })
    }    

    console.log("Watching 'site' for changes...")
    watch(
        import.meta.dir + "/site",
        { recursive: true },
        (event, filename) => {
            console.log(`Detected ${event} in ${filename}`)
            if (filename){
                refreshStaticSite(filename).then(res => {
                    filesChanged = true
                    console.log(res)
                })
            }
        },
    )

    return "exited"
}


main()