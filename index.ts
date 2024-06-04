import fs from "node:fs"
import nunjucks from "nunjucks"


nunjucks.configure('site', { autoescape: true })

if (!fs.existsSync("dist")) fs.mkdirSync("dist")

let routes: { [key: string]: string } = {}

fs.readdirSync("./site/pages").forEach(filename => {

    let noExtFilename = filename.replace(".nj", "")
    let htmlFilename = filename.replace(".nj", ".html")

    fs.writeFileSync(`./dist/${htmlFilename}`, nunjucks.render(`pages/${filename}`))

    if (noExtFilename == "index") routes["/"] = `./dist/${htmlFilename}`
    else routes["/" + noExtFilename] = `./dist/${htmlFilename}`

})


let server = Bun.serve({
    fetch(req) {
        const url = new URL(req.url)
        if (routes[url.pathname]) return new Response(Bun.file(routes[url.pathname]))
        return new Response("Page doesn't exist!")
    },
    development: process.env.DEBUG == '0',
    port: process.env.PORT || 3000,
})


console.log(`Listening on http://localhost:${server.port} ...`)
