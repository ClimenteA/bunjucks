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


Bun.serve({
    fetch(req) {

        const url = new URL(req.url)

        if (routes[url.pathname]) {
            return new Response(Bun.file(routes[url.pathname]))
        }

        return new Response("Page doesn't exist!")
    },
    port: process.env.PORT || 3000,
})

