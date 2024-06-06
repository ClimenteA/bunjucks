import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import { watch } from "fs"
import { readdir } from "fs/promises"
import nunjucks from "nunjucks"


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
    return config
}

async function buildStaticSite() {
    
    let cfg = await getConfig()
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

    Bun.write("./public/serve.json", JSON.stringify({cleanUrls: true}, null, 4))

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

    console.log("Watching 'site' for changes...")
    watch(
        import.meta.dir + "/site",
        { recursive: true },
        (event, filename) => {
            console.log(`Detected ${event} in ${filename}`)
            if (filename){
                refreshStaticSite(filename).then(res => console.log(res))
            }
        },
    )

    return "exited"
}


main()