const fs = require("fs")
const _path = require("path")
const inquirer = require("inquirer")

const ps = require("./ps")
const utils = require("../libs/utils")

module.exports = async () => {
    global.logger.info(`JD+ Bundle Fixer`)
    
    let folderPath = await ps.run("select-folder", "Select a folder with bundles")
    fixBundles(folderPath)
}

async function fixBundles(path) {

    global.logger.info(`Reading folder:`, path)
    let stats = fs.lstatSync(path)
    if (!stats.isDirectory()) {
        global.logger.warn(`The path you provided is not a folder!`)
        return;
    }

    let outputPath = `fixed-bundles/`
	let folderContent = fs.readdirSync(path)

    folderContent.forEach(file => {

        let filePath = _path.resolve(path, file)
        let content = fs.readFileSync(filePath)
        
        if (isBundle(content)) {
            if (content.includes("Content-Disposition")) {
                content = content.slice(74) // Remove the first uuid
                content = content.slice(0, -50) // Remove the last uuid
                utils.writeOutput(`${outputPath}/${file}`, content)
                global.logger.info(`Fixed and saved ${file}!`)
            }
        }
        else {
            global.logger.info(`${file} is not a bundle file!`)
        }

    })

    global.logger.success(`Converted all files successfully!`)
    if (global.config.OPEN_OUTPUT_FOLDER) {
        await ps.run("open-folder", _path.resolve(utils.getOutputPath(outputPath)[1]))
    }
}

function isBundle(content) {
    if (content.includes("UnityFS"))
        return true
    else
        return false
}