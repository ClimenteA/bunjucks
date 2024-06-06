import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import { watch } from "fs"
import { readdir } from "fs/promises"
import nunjucks from "nunjucks"

let PORT = 5173
let DEBUG = true
let DOMAIN = "localhost:5173"
let CONFIG_PATH = "./bunjucks.config.json"


interface Config {
    port: number
    domain: string
    debug: boolean
    store?: any
}

async function getConfig(){
    let file = Bun.file(CONFIG_PATH)
    let config: Config = await file.json()
    PORT = config.port
    DOMAIN = config.domain
    DEBUG = config.debug
    return config
}


async function makeRoutes(filepaths: string[]){

    let routes: {[key: string]: string } = {}

    for (let p of filepaths){
        if (p.endsWith("serve.json")) continue
        if (p.includes("./public")) p = p.replace("./public", "")
        if (p.endsWith("index.html")) {
            let r = p.replace("/index.html", "")
            if (r == "") r = "/"
            routes[r] = p
        } else {
            let r = p.replace(".html", "")
            routes[r] = p
        }
    }

    return routes


}

async function getPublicRoutes(){
    await getConfig()

    let filepaths = await readdir("./public", { recursive: true })

    let publicPaths = []
    for (let fp of filepaths) {
        let relPath = "./public/" + fp
        if ((await fs.lstat(relPath)).isDirectory()) continue
        publicPaths.push(relPath)
    }

    return await makeRoutes(publicPaths)
}

async function buildStaticSite() {
    
    let cfg = await getConfig()
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

    return await makeRoutes(publicPaths)

}

async function tailwindReload() {
    await $`npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css`.text()
    return "CSS refreshed!"
}

async function refreshStaticSite(filename: string) {
    let start = performance.now()
    if (filename.endsWith(".html") || filename.endsWith(".css") || filename.endsWith(".js")) {
        await tailwindReload()
        let routes = await buildStaticSite()
        console.log(`Created site in ${(performance.now() - start).toFixed(2)} ms`)
        return routes
    }
    return {}
}

async function main(){

    if (process.env.DEV == undefined) {
        console.log("Build public assets")
        await refreshStaticSite("index.html")
        return "exited"
    }

    if (process.env.DEV == "0") {

        console.log("Serving site from public folder....")

        let routes = await getPublicRoutes()

        Bun.serve({
            async fetch(req) {

                const url = new URL(req.url)

                if (routes[url.pathname]) {
                    console.log(routes[url.pathname])
                    return new Response(Bun.file(routes[url.pathname]))
                }

                return new Response("Page does not exist!")
            },
            development: false,
            port: PORT,
            hostname: "0.0.0.0"
        })
    
        return "exited"

    }

    if (process.env.DEV == "1") {

        console.log("Dev mode")

        let routes = await refreshStaticSite("index.html")
    
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

}


main().then(res => console.log(res))