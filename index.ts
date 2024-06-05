import fs from "node:fs"
import { watch } from "fs"
import { readdir } from "node:fs/promises"
import nunjucks from "nunjucks"
import path from "path"

let pagesPath = "./site/pages"
let routes: { [key: string]: string } = {}

async function makeRoutes() {
    if (!fs.existsSync("dist")) fs.mkdirSync("dist")
    nunjucks.configure('site', { autoescape: true })

    let files = await readdir(pagesPath, { recursive: true })

    for (let file of files) {
        let fullpath = path.join(pagesPath, file)

        if (fs.lstatSync(fullpath).isFile()) {

            if (fullpath.startsWith("site/pages/index.")) {
                let exportPath = "./dist/index.html"
                routes["/"] = exportPath
                fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`))
            } else {

                let nestedPathLen = file.split("/").length

                if (nestedPathLen == 1) {
                    let filename = path.basename(file).replace(".html", "").replace(".html", "")
                    let exportPath = `./dist/${filename}.html`
                    routes["/" + filename] = exportPath
                    fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`))
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
                    fs.writeFileSync(exportPath, nunjucks.render(`pages/${file}`))
                } else {
                    throw new Error('Only 1 level nested directories are allowed')
                }
            }
        }
    }

    console.log("Routes", routes)

}

let filesChanged = true

makeRoutes().then(res => console.log("HTML files created"))

let server = Bun.serve({
    fetch(req) {

        if (filesChanged == true) {
            if (process.env.DEBUG == '1') {
                makeRoutes().then(res => console.log("HTML files created"))
            }
        }

        const url = new URL(req.url)

        if (url.pathname.includes("__reload") && process.env.DEBUG == '1') {
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

        return new Response("Page doesn't exist!")
    },
    development: process.env.DEBUG == '1',
    port: process.env.PORT || 3000,
})

if (process.env.DEBUG == '1') {
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
