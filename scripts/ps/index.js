const fs = require("fs")
const path = require("path")
const spawn = require("child_process").spawn

module.exports.run = async (scriptName, ...args) => {

    let scriptPath = path.resolve(__dirname, scriptName + ".js")

    if (!fs.existsSync(scriptPath)) {
        global.logger.error(scriptPath, "is not an existing PS script! Exiting...")
        process.exit()
    }

    let psScript = require(scriptPath)(args)

    child = spawn("powershell.exe", [psScript]);
    
    let data = "";
    for await (const chunk of child.stdout) {
        data += chunk;
    }
    let error = "";
    for await (const chunk of child.stderr) {
        error += chunk;
    }
    const exitCode = await new Promise( (resolve, reject) => {
        child.on('close', resolve);
    });

    if(exitCode) {
        //throw new Error( `subprocess error exit ${exitCode}, ${error}`);
    }
    return data.trim();
}