import fs from "node:fs"
import { watch } from "fs"
import { readdir } from "node:fs/promises"
import nunjucks from "nunjucks"
import path from "path"

let PORT = process.env.PORT || 3000
let DOMAIN = process.env.domain || "localhost:" + PORT
let DEBUG = process.env.DEBUG == '1'
let assetsPath = "./site/assets"
let pagesPath = "./site/pages"
let routes: { [key: string]: string } = {}


async function makeRoutes() {

    nunjucks.configure('site', { autoescape: true })

    if (!fs.existsSync("dist/assets")) {
        fs.mkdirSync("dist/assets", { recursive: true })
    }

    let staticFiles = await readdir(assetsPath)
    let files = await readdir(pagesPath, { recursive: true })

    // Pages routes
    for (let file of files) {
        let fullpath = path.join(pagesPath, file)

        if (!fs.lstatSync(fullpath).isFile()) continue

        if (fullpath.startsWith("site/pages/index.")) {
            let exportPath = "./dist/index.html"
            routes["/"] = exportPath
            fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`, { debug: DEBUG }))
        } else {

            let nestedPathLen = file.split("/").length

            if (nestedPathLen == 1) {
                let filename = path.basename(file).replace(".html", "").replace(".html", "")
                let exportPath = `./dist/${filename}.html`
                routes["/" + filename] = exportPath
                fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`, { debug: DEBUG }))
            } else if (nestedPathLen == 2) {
                let subRoute = file.split("/")[0]
                let filename = path.basename(file).replace(".html", "").replace(".html", "")
                let exportPath = `./dist/${subRoute}/${filename}.html`
                if (filename == "index") {
                    routes[`/${subRoute}`] = exportPath
                } else {
                    routes[`/${subRoute}/${filename}`] = exportPath
                }
                fs.mkdirSync(path.dirname(exportPath), { recursive: true })
                fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`, { debug: DEBUG }))
            } else {
                throw new Error('Only 1 level nested directories are allowed')
            }
        }
    }


    // Assets, robot.txt, sitemap.xml routes
    for (let file of staticFiles) {
        let fullpath = path.join(assetsPath, file)
        if (!fs.lstatSync(fullpath).isFile()) continue

        let staticFilename = path.basename(fullpath)

        if (staticFilename == "reload.js") {
            let exportPath = "./dist/assets/reload.js"
            routes["/assets/reload.js"] = exportPath
            fs.writeFileSync(exportPath, nunjucks.render("assets/reload.js", { port: PORT, debug: DEBUG }))
        }
        else if (staticFilename == "robots.txt") {
            let exportPath = "./dist/robots.txt"
            routes["/robots.txt"] = exportPath
            fs.writeFileSync(exportPath, nunjucks.render("assets/robots.txt", { domain: DOMAIN }))
        }
        else if (staticFilename == "sitemap.xml") {
            let timestamp = new Date().toISOString()
            let exportPath = "./dist/sitemap.xml"
            routes["/sitemap.xml"] = exportPath

            let urls = Array.from(Object.keys(routes)).filter(route =>
                !["robots.txt", "sitemap.xml", "reload.js"].some(suffix => route.endsWith(suffix))
            )

            fs.writeFileSync(
                exportPath,
                nunjucks.render("assets/sitemap.xml",
                    {
                        domain: DOMAIN,
                        routes: urls,
                        timestamp: timestamp
                    }
                )
            )
        }
        else {

            if (staticFilename == "tailwind.css") continue

            let exportPath = `./dist/assets/${staticFilename}`

            let bunFile = Bun.file(fullpath)
            let fileContents = await bunFile.text()

            routes[`/assets/${staticFilename}`] = exportPath
            fs.mkdirSync(path.dirname(exportPath), { recursive: true })
            fs.writeFileSync(exportPath, fileContents)

        }
    }

    console.log("Routes", routes)

}

let filesChanged = true

makeRoutes().then(res => console.log("HTML files created"))

let server = Bun.serve({
    fetch(req) {

        if (filesChanged == true) {
            if (DEBUG) {
                makeRoutes().then(res => console.log("HTML files created"))
            }
        }

        const url = new URL(req.url)

        if (url.pathname.includes("__reload") && DEBUG) {
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
    development: DEBUG,
    port: PORT,
})

if (DEBUG) {
    watch(
        import.meta.dir + "/site",
        { recursive: true },
        (event, filename) => {
            filesChanged = true
            console.log(`Detected ${event} in ${filename}`)
        },
    )
}

console.log(`Listening on http://${server.hostname}:${server.port} ...`)
