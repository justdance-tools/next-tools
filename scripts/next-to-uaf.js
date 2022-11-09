const fs = require("fs")
const _path = require("path")
const inquirer = require("inquirer")

const ps = require("./ps")
const utils = require("../libs/utils")

// Options for file/folder selection
let options = [{
    type: "list",
    message: "Please select an option below.",
    name: "options",
    choices: [{
        name: "Convert a file only",
        value: "file-only",
    }, 
    {
        name: "Convert a folder",
        value: "folder-only"
    }]
}]

// Main func that asks user if they want to use a file or a folder
module.exports = async () => {

    global.logger.info(`Next to UAF converter`)
    
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
                    let folderPath = "C:\\Users\\Asus\\Desktop\\BlackWidow" //await ps.run("select-folder", "Select a JDNext folder!")
                    convertFolder(folderPath)
            }
        });
}

async function convertFile(path) {
    global.logger.info(`Converting file:`, path)
}

async function convertFolder(path) {

    global.logger.info(`Converting folder:`, path)
    let stats = fs.lstatSync(path)
    if (!stats.isDirectory()) {
        global.logger.info(`The path you provided is not a folder!`)
        return;
    }

    // Since there's no current way to detect the mapName
    // (according the early build of jdnext, none of the jsons except the songdesc has the mapName mentioned)
    // (and the songdesc's filename is the mapname so we have to scan all JSONs and find the songdesc)

    let folderContent = fs.readdirSync(path)

    // Scan all JSONs
    let jsonFiles = folderContent.filter(f => f.endsWith(".json"))
    let jsons = {}
    jsonFiles.forEach(f => {
        jsons[f.split(".")[0]] = require(_path.join(path, f))
    });

    let mapName
    let mapNameLower
    let songData = {}
    // Find song data file and assign mapName
    Object.values(jsons).forEach(d => {
        if (d["m_songDesc"]) {
            songData = d
            mapName = d["m_mapName"] || d["m_songDesc"]["MapName"]
            mapNameLower = mapName.toLowerCase()
            return;
        }
    });
    if (!mapName) {
        global.logger.error(`Couldn't find a song data file or a mapName from the folder, are you sure it's a valid folder or it has a songData file?`)
        return
    }
    global.logger.info(`Found mapName, ${mapName}`);

    let outputPath = `${mapName}/uaf`
    let {
        "m_songDesc": songDesc,
        "m_danceData": danceData,
        "m_karaokeData": karaokeData, 
        "m_trackData": trackData
    } = songData

    songDesc = validateSongDesc(songDesc)
    danceData = validateDanceData(mapName, danceData)
    karaokeData = validateKaraokeData(mapName, karaokeData)
    trackData = validateTrackData(mapName, trackData)

    utils.writeOutput(`${outputPath}/audio/${mapNameLower}_musictrack.tpl.ckd`, trackData)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_dance.dtape.ckd`, danceData)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_karaoke.ktape.ckd`, karaokeData)
    utils.writeOutput(`${outputPath}/songdesc.tpl.ckd`, songDesc)

    global.logger.success(`Converted all files successfully!`)
    if (global.config.OPEN_OUTPUT_FOLDER) {
        await ps.run("open-folder", _path.resolve(utils.getOutputPath(outputPath)[1]))
    }
}

function validateSongDesc(data) {
    return {
        __class: "Actor_Template",
        WIP: 0,
        LOWUPDATE: 0,
        UPDATE_LAYER: 0,
        PROCEDURAL: 0,
        STARTPAUSED: 0,
        FORCEISENVIRONMENT: 0,
        COMPONENTS: [{
            __class: "JD_SongDescTemplate",
            ...data,
			backgroundType: 0,
			LyricsType: 0,
			Tags: ["Main"],
			Status: 3,
			LocaleID: 4294967295,
			MojoValue: 0,
			CountInProgression: 1,
			DefaultColors: {
                songcolor_1a: [1, 0.266667, 0.266667, 0.266667],
                songcolor_1b: [1, 0.066667, 0.066667, 0.066667],
                songcolor_2a: [1, 1, 1, 1],
                songcolor_2b: [1, 0.466667, 0.466667, 0.466667],
                lyrics: [1, 0.172549, 0.792157, 0.94902],
                theme: [1, 1, 1, 1]
			},
			VideoPreviewPath: ""
        }]
    }
}

function validateDanceData(mapName, data) {
    let clips = [].concat(data.MotionClips, data.PictoClips);
    return {
        __class: "Tape",
        Clips: clips,
        TapeClock: 0,
        TapeBarCount: 1,
        FreeResourcesAfterPlay: 0,
        MapName: mapName,
        SoundwichEvent: ""
    };
}

function validateKaraokeData(mapName, data) {
    let clips = data.Clips.map(clip => clip.KaraokeClip);
    return {
        __class: "Tape",
        Clips: clips,
        TapeClock: 0,
        TapeBarCount: 1,
        FreeResourcesAfterPlay: 0,
        MapName: mapName,
        SoundwichEvent: ""
    };
}

function validateTrackData(mapName, data) {
    data = data.m_structure.MusicTrackStructure
    return {
        __class: "Actor_Template",
        WIP: 0,
        LOWUPDATE: 0,
        UPDATE_LAYER: 0,
        PROCEDURAL: 0,
        STARTPAUSED: 0,
        FORCEISENVIRONMENT: 0,
        COMPONENTS: [{
                __class: "MusicTrackComponent_Template",
                trackData: {
                    __class: "MusicTrackData",
                    structure: {
                        __class: "MusicTrackStructure",
                        markers: data.markers.map(s => s.VAL),
                        signatures: data.signatures.map(s => s.MusicSignature),
                        sections: data.sections.map(s => s.MusicSection),
                        startBeat: data.startBeat,
                        endBeat: data.endBeat,
                        fadeStartBeat: 0,
                        useFadeStartBeat: false,
                        fadeEndBeat: 0,
                        useFadeEndBeat: false,
                        videoStartTime: data.videoStartTime,
                        previewEntry: data.previewEntry,
                        previewLoopStart: data.previewLoopStart,
                        previewLoopEnd: data.previewLoopEnd,
                        volume: -1,
                        fadeInDuration: 0,
                        fadeInType: 0,
                        fadeOutDuration: 0,
                        fadeOutType: 0
                    },
                    path: `world/maps/${mapName.toLowerCase()}/audio/${mapName.toLowerCase()}.ogg`,
                    url: `jmcs://jd-contents/${mapName}/${mapName}.ogg`
                }
            }
        ]
    };    
}