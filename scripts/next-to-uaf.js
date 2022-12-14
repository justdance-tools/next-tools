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
                    let folderPath = await ps.run("select-folder", "Select a JDNext map folder!")
                    convertFolder(folderPath)
            }
        });
}

async function convertFile(path) {
    global.logger.info(`Converting file:`, path)

    let allowedTypes = ["songData"]
    let fileType = utils.getFileType("next", path)
    if (!fileType || !allowedTypes.includes(fileType)) {
        global.logger.warn(`Couldn't find type of selected file, are you sure it's a Next file?`)
        return;
    }
    global.logger.info(`Detected file type:`, fileType)

    // If fileType is songData read file and get mapname and songdata
    if (fileType === "songData") {

        let songData = JSON.parse(fs.readFileSync(path))
        let mapName = songData["MapName"] || songData["SongDesc"]["MapName"]
        let mapNameLower = mapName.toLowerCase()

        global.logger.info(`Converting ${mapName} songData...`);
    
        let outputPath = `uaf/${mapName}`
    
        let { songDesc, danceData, karaokeData, trackData } = parseSongData(mapName, songData)
        
        utils.writeOutput(`${outputPath}/audio/${mapNameLower}_musictrack.tpl.ckd`, trackData, true)
        utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_dance.dtape.ckd`, danceData, true)
        utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_karaoke.ktape.ckd`, karaokeData, true)
        utils.writeOutput(`${outputPath}/songdesc.tpl.ckd`, songDesc, true)
    
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
    
    utils.writeOutput(`${outputPath}/audio/${mapNameLower}_musictrack.tpl.ckd`, trackData, true)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_dance.dtape.ckd`, danceData, true)
    utils.writeOutput(`${outputPath}/timeline/${mapNameLower}_tml_karaoke.ktape.ckd`, karaokeData, true)
    utils.writeOutput(`${outputPath}/songdesc.tpl.ckd`, songDesc, true)

    global.logger.success(`Converted all files successfully!`)
    if (global.config.OPEN_OUTPUT_FOLDER) {
        await ps.run("open-folder", _path.resolve(utils.getOutputPath(outputPath)[1]))
    }
}

function findSongData(path) {
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
    let songData = {}
    // Find song data file and assign mapName
    Object.values(jsons).forEach(d => {
        if (d["SongDesc"]) {
            songData = d
            mapName = d["MapName"] || d["SongDesc"]["MapName"]
            mapNameLower = mapName.toLowerCase()
            return;
        }
    });

    if (!songData["TrackData"] || (songData["TrackData"] && !songData["TrackData"]["MusicTrackStructure"])) {
        global.logger.info(`SongData doesn't have musicTrack by default, trying to fetch the musictrack file...`)

        let filePath = _path.resolve(path, "MusicTrack.json")
        if (!fs.existsSync(filePath)) {
            global.logger.warn(`This song does not have any MusicTrack data!`)
        }
        else {
            let musicTrack = require(filePath)
            songData.TrackData = musicTrack
        }
    }

    return {
        mapName, songData
    }
}

function parseSongData(mapName, songData) {
    let {
        "SongDesc": songDesc,
        "DanceData": danceData,
        "KaraokeData": karaokeData,
        "TrackData": trackData
    } = songData

    songDesc = validateSongDesc(songDesc)
    danceData = validateDanceData(mapName, danceData)
    karaokeData = validateKaraokeData(mapName, karaokeData)
    trackData = validateTrackData(mapName, trackData)

    return { songDesc, danceData, karaokeData, trackData }
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

function validateCinematics(mapName, data) {

}

function validateDanceData(mapName, data) {
    let { MotionClips, PictoClips, GoldEffectClips, HideHudClips } = data

    MotionClips = MotionClips.map(c => {
        if (!c.MoveName.includes("timeline/moves")) {
            let extension = c.MoveType === 0 ? ".msm" : ".gesture"
            c.ClassifierPath = `world/maps/${mapName.toLowerCase()}/timeline/moves/${c.MoveName}${extension}`
        }
        return {
            __class: "MotionClip",
            ...c
        }
    })
    PictoClips = PictoClips.map(c => {
        if (!c.PictoPath.includes("timeline/pictos")) {
            c.PictoPath = `world/maps/${mapName.toLowerCase()}/timeline/pictos/${c.PictoPath}.png`
        }
        return {
            __class: "PictogramClip",
            ...c
        }
    })
    GoldEffectClips = GoldEffectClips.map(c => {
        return {
            __class: "GoldEffectClip",
            ...c
        }
    })

    let clips = [].concat(MotionClips, PictoClips, GoldEffectClips);

    if (global.config.SORT_BY_TIME) 
        clips = clips.sort((a, b) => a.StartTime - b.StartTime);

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

    clips = clips.map(c => {
        c.__class = "KaraokeClip"
        return c
    })
   
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