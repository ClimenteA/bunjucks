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

async function getConfig() {
    let file = Bun.file("./bunjucks.config.json")
    let config: Config = await file.json()
    config.store = config.store ? {...process.env, ...config.store} : process.env
    return config
}

async function getRoutes(cfg: Config) {

    let routes: { [key: string]: string } = {}
    let filepaths = await readdir("./public", { recursive: true })

    for (let fp of filepaths) {
        let relPath = "./public/" + fp
        if ((await fs.lstat(relPath)).isDirectory()) continue
        if (fp == "serve.json") continue

        if (fp.endsWith("index.html")) {

            let r = fp.replace("/index.html", "").replace("index.html", "")
            if (!r.startsWith("/")) r = "/" + r

            if (cfg.domain.includes("github.io")) {
                r = cfg.domain.split("github.io")[1] + r
            }

            routes[r] = relPath

        } else {
            let r = "/" + fp.replace(".html", "")

            if (!r.startsWith("/")) r = "/" + r

            if (cfg.domain.includes("github.io")) {
                r = cfg.domain.split("github.io")[1] + r
            }

            routes[r] = relPath
        }
    }

    nunjucks.configure('site', { autoescape: true })

    let timestamp = new Date().toISOString()
    let sitemapRoutes = Array.from(Object.keys(routes)).filter(route => !route.includes("."))

    let domain = cfg.domain
    if (cfg.domain.includes("github.io")) {
        domain = cfg.domain.split("/")[0]
    }

    await fs.writeFile(
        "./public/sitemap.xml",
        nunjucks.render(
            "pages/sitemap.xml",
            { ...cfg, domain: domain, routes: sitemapRoutes, timestamp: timestamp }
        )
    )

    await fs.writeFile("./public/robots.txt", nunjucks.render("pages/robots.txt", cfg))

    console.log("Routes:", routes)

    return routes
}

async function tailwindBuild() {
    await $`npx tailwindcss -i ./site/assets/tailwind.css -o ./site/assets/styles.css`.text()
}

async function buildStaticSite(initConfig: Config, filename: string) {

    if (!(filename.endsWith(".html") || filename.endsWith(".css") || filename.endsWith(".js"))) {
        return
    }

    let start = performance.now()

    let cfg = {...initConfig}

    if (cfg.use_tailwind) {
        await tailwindBuild()
    }

    if (cfg.domain.includes("github.io")) {
        cfg.domain = cfg.domain.split("github.io")[1]
    } 
    else if (!cfg.domain.includes("github.io") && cfg.domain.length > 0) {
        cfg.domain = ""
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
            await fs.writeFile(publicPath, nunjucks.render(fp, cfg))
        }

        if (fp.startsWith("assets")) {
            if (fp.endsWith(".js")) {
                if (fp.endsWith("reload.js") && cfg.debug == false) continue
                let publicPath = "./public/" + fp
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                try {
                    await fs.writeFile(publicPath, nunjucks.render(fp, cfg))    
                } catch (error) {
                    let bunFile = Bun.file("./site/" + fp)
                    await Bun.write(publicPath, bunFile)
                }
            }
            else {
                let publicPath = "./public/" + fp
                let bunFile = Bun.file(relPath)
                await fs.mkdir(path.dirname(publicPath), { recursive: true })
                await Bun.write(publicPath, bunFile)
            }
        }
    }

    let servefp = "./public/serve.json"
    if (!await fs.exists(servefp)) {
        Bun.write(servefp, JSON.stringify({ cleanUrls: true }, null, 4))
    }

    console.log(`Done in ${(performance.now() - start).toFixed(2)} ms`)

}

async function runInDevMode() {

    let cfg = await getConfig()
    cfg.debug = true
    console.log("Server config:", cfg)

    await buildStaticSite(cfg, "index.html")
    let routes = await getRoutes(cfg)

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

            return new Response(Bun.file(routes["/404"]))
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
            if (filename) {
                await buildStaticSite(cfg, filename)
                routes = await getRoutes(cfg)
                filesChanged = true
            }
        },
    )

}

async function runInProdMode() {

    let cfg = await getConfig()
    cfg.debug = false
    console.log("Server config:", cfg)

    let routes = await getRoutes(cfg)

    Bun.serve({
        async fetch(req) {

            const url = new URL(req.url)

            if (routes[url.pathname]) {
                console.log(new Date().toISOString(), routes[url.pathname])
                return new Response(Bun.file(routes[url.pathname]))
            }

            return new Response(Bun.file(routes["/404"]))
        },
        development: false,
        port: cfg.port,
        hostname: "0.0.0.0"
    })

}

async function main() {
    if (process.env.DEV == undefined) {
        let cfg = await getConfig()
        cfg.debug = false
        await buildStaticSite(cfg, "index.html")
        await getRoutes(cfg)
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
