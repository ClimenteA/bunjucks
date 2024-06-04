import fs from "node:fs"
import nunjucks from "nunjucks"
import { watch } from "fs"


if (!fs.existsSync("dist")) fs.mkdirSync("dist")

let routes: { [key: string]: string } = {}

function makeRoutes() {

    nunjucks.configure('site', { autoescape: true })

    fs.readdirSync("./site/pages").forEach(filename => {

        let noExtFilename = filename.replace(".nj", "")
        let htmlFilename = filename.replace(".nj", ".html")
        let exportHTMLFilepath = `./dist/${htmlFilename}`

        fs.writeFileSync(exportHTMLFilepath, nunjucks.render(`pages/${filename}`))

        if (noExtFilename == "index") routes["/"] = exportHTMLFilepath
        else routes["/" + noExtFilename] = exportHTMLFilepath

    })
}

let filesChanged = true

let server = Bun.serve({
    fetch(req) {

        if (filesChanged == true) {
            if (process.env.DEBUG == '1' || process.env.DEBUG == undefined) {
                console.log("Recreating html files...")
                makeRoutes()
                console.log("Done recreating html files!")
            }
        }

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

        return new Response("Page doesn't exist!")
    },
    development: process.env.DEBUG == '1',
    port: process.env.PORT || 3000,
})


watch(
    import.meta.dir + "/site",
    { recursive: true },
    (event, filename) => {
        filesChanged = true
        console.log(`Detected ${event} in ${filename}`)
    },
)

console.log(`Listening on http://${server.hostname}:${server.port} ...`)
