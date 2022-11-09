// NOT DONE YET!!!!!!!! STILL BROCKEN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


const fs = require("fs")
const _path = require("path")
const inquirer = require("inquirer")

const ps = require("./ps")
const utils = require("../libs/utils")
const { parse } = require("path")

// Options for file/folder selection
let options = [{
    type: "list",
    message: "Please select an option below.",
    name: "options",
    choices: [{
        name: "Convert a file only",
        value: "file-only"
    }, 
    {
        name: "Convert a folder",
        value: "folder-only"
    }]
}]

// Main func that asks user if they want to use a file or a folder
module.exports = async () => {

    global.logger.info(`UAF to Next converter`)
    
    inquirer
        .prompt(options)
        .then(async (r) => {
            let option = r.options
            
            switch(option) {
                case "file-only":
                    let filePath = await ps.run("select-file", "Select a file!")
                    convertFile(filePath)
                    break;
                case "folder-only":
                    let folderPath = await ps.run("select-folder", "Select a UbiArt map folder!")
                    convertFolder(folderPath)
            }
        });
}

async function convertFile(path) {
    global.logger.info(`Converting file:`, path)

    let allowedTypes = ["dtape", "ktape", "musictrack", "songdesc"]
    let fileType = utils.getFileType("uaf", path)
    if (!fileType || !allowedTypes.includes(fileType)) {
        global.logger.warn(`Couldn't find type of selected file, are you sure it's a UbiArt file?`)
        return;
    }
    global.logger.info(`Detected file type:`, fileType)

    let outputPath = `next/${mapName}`

    if (fileType === "songDesc") {

        let songDesc = JSON.parse(fs.readFileSync(path))
        songDesc = songDesc["COMPONENTS"][0]

        let mapName = songDesc.MapName
        let mapNameLower = mapName.toLowerCase()

        global.logger.info(`Converting ${mapName} songData...`);
        
        utils.writeOutput(`${outputPath}/audio/${mapNameLower}_musictrack.tpl.ckd`, trackData)
        utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_dance.dtape.ckd`, danceData)
        utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_karaoke.ktape.ckd`, karaokeData)
        utils.writeOutput(`${outputPath}/songdesc.tpl.ckd`, songDesc)
    
        global.logger.success(`Converted all files successfully!`)
        if (global.config.OPEN_OUTPUT_FOLDER) {
            await ps.run("open-folder", _path.resolve(utils.getOutputPath(outputPath)[1]))
        }
    }
    
}

async function convertFolder(path) {

    global.logger.info(`Converting folder:`, path)
    let stats = fs.lstatSync(path)
    if (!stats.isDirectory()) {
        global.logger.warn(`The path you provided is not a folder!`)
        return;
    }

    // Try to find songData in the map folder
    let { mapName, songData } = findSongData(path)
    if (!mapName) {
        global.logger.error(`Couldn't find a song data file or a mapName from the folder, are you sure it's a valid folder or it has a songData file?`)
        return;
    }
    global.logger.info(`Found mapName: ${mapName}`);

    let outputPath = `uaf/${mapName}`

    let { songDesc, danceData, karaokeData, trackData } = parseSongData(mapName, songData)
    
    utils.writeOutput(`${outputPath}/audio/${mapNameLower}_musictrack.tpl.ckd`, trackData)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_dance.dtape.ckd`, danceData)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_karaoke.ktape.ckd`, karaokeData)
    utils.writeOutput(`${outputPath}/songdesc.tpl.ckd`, songDesc)

    global.logger.success(`Converted all files successfully!`)
    if (global.config.OPEN_OUTPUT_FOLDER) {
        await ps.run("open-folder", _path.resolve(utils.getOutputPath(outputPath)[1]))
    }
}
