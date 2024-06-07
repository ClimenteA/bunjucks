import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import { watch } from "fs"
import { readdir } from "fs/promises"
import nunjucks from "nunjucks"


interface Config {
    port: number
    domain: string
    use_tailwind: boolean
    store?: any
    debug?: boolean
}

async function getConfig(){
    let file = Bun.file("./bunjucks.config.json")
    let config: Config = await file.json()
    return config
}


async function getRoutes(){

    let routes: {[key: string]: string } = {}
    let filepaths = await readdir("./public", { recursive: true })

    for (let fp of filepaths) {
        let relPath = "./public/" + fp
        if ((await fs.lstat(relPath)).isDirectory()) continue
        if (fp == "serve.json") continue

        if (fp.endsWith("index.html")) {
            let r = fp.replace("/index.html", "").replace("index.html", "")
            if (!r.startsWith("/")) r = "/" + r
            routes[r] = relPath
        } else {
            let r = "/" + fp.replace(".html", "")
            routes[r] = relPath
        }  
    } 

    console.log("Routes:", routes)
    
    return routes
}


async function tailwindBuild() {
    await $`npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css`.text()
}

async function buildStaticSite(cfg: Config, filename: string) {

    if (!(filename.endsWith(".html") || filename.endsWith(".css") || filename.endsWith(".js"))) {
        return
    }

    let start = performance.now()   
    
    if (cfg.use_tailwind) {
        await tailwindBuild()
    }
    
    let filepaths = await readdir("./site", { recursive: true })
    nunjucks.configure('site', { autoescape: true })

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
                if (fp.endsWith("reload.js") && cfg.debug == false) continue
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

    let servefp = "./public/serve.json"
    if(!await fs.exists(servefp)) {
        Bun.write(servefp, JSON.stringify({cleanUrls: true}, null, 4))
    }

    console.log(`Done in ${(performance.now() - start).toFixed(2)} ms`)

}


async function runInDevMode() {

    let cfg = await getConfig()
    cfg.debug = true
    console.log("Server config:", cfg)

    await buildStaticSite(cfg, "index.html")
    let routes = await getRoutes()
    
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
        port: cfg.port,
    })

    console.log("Watching 'site' for changes...")
    watch(
        import.meta.dir + "/site",
        { recursive: true },
        async (event, filename) => {
            console.log(`Detected ${event} in ${filename}`)
            if (filename){
                await buildStaticSite(cfg, filename)
                routes = await getRoutes()
                filesChanged = true
            }
        },
    )

}


async function runInProdMode() {

    let cfg = await getConfig()
    cfg.debug = false
    console.log("Server config:", cfg)

    let routes = await getRoutes()

    Bun.serve({
        async fetch(req) {

            const url = new URL(req.url)

            if (routes[url.pathname]) {
                console.log(new Date().toISOString(), routes[url.pathname])
                return new Response(Bun.file(routes[url.pathname]))
            }

            return new Response("Page does not exist!")
        },
        development: false,
        port: cfg.port,
        hostname: "0.0.0.0"
    })

}

async function main(){
    if (process.env.DEV == undefined) {
        let cfg = await getConfig()
        cfg.debug = false
        await buildStaticSite(cfg, "index.html")
        return "Public folder with static site was built."
    }
    else if (process.env.DEV == "off") {
        console.log("Waiting for requests...")
        await runInProdMode()
    }
    else if (process.env.DEV == "on") {
        console.log("Development mode...")
        await runInDevMode()
    }
}


await main()
