const fs = require("fs")
const path = require("path")

class Utils {
    constructor() {}

    notAvailable() {
        global.logger.info(`This script is not available for use yet!`)
        process.exit()
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