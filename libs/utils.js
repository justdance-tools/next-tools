const fs = require("fs")
const path = require("path")

class Utils {
    constructor() {}

    notAvailable() {
        global.logger.info(`This script is not available for use yet!`)
        process.exit()
    }

    getFileType(engine, _path, content) {
        let filePath = path.dirname(_path) || ""
        let fileName = path.basename(_path)

        if (!content) content = JSON.parse(fs.readFileSync(_path))
        let split = fileName.split(".")

        if (engine === "uaf") {
            let tapeTypes = ["dtape", "ktape", "tape"]
            let templateTypes = ["tpl"]
            
            let isCooked = false;
            let isTape = false;
            let isTemplate = false;

            if (split[split.length-1] === "ckd") isCooked = true;
            if (tapeTypes.includes(split[1])) isTape = true;
            if (templateTypes.includes(split[1])) isTemplate = true;

            if (isCooked && isTape) return split[1]
            if (isCooked && isTemplate) return split[1]
        }
        else if (engine === "next") {
            if (content["m_songDesc"] && content["m_mapName"]) return "songData"
        }
    }

    getOutputPath(_path) {
        let filePath = path.dirname(_path) || ""
        let fileName = path.basename(_path)

        let outputFolder = path.resolve("output", filePath)
        let finalPath = path.resolve(outputFolder, fileName)
        return [outputFolder, finalPath]
    }

    writeOutput(_path, data) {
        data = global.config.MINIFY_JSON ? JSON.stringify(data) : JSON.stringify(data, null, 2)
        let [ outputFolder, finalPath ] = this.getOutputPath(_path)

        fs.mkdirSync(outputFolder, { recursive: true })
        fs.writeFileSync(finalPath, data)
    }
}

module.exports = new Utils();