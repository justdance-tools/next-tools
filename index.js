global.logger = require("signale")
global.config = require("./config")

const fs = require("fs")
const path = require("path")
const inquirer = require("inquirer")

const { name, author, version } = require("./package.json")
let welcome = `${name} by ${author} (${version})\n`

console.log(welcome)

let options = [{
    type: "list",
    message: "Please select an option below.",
    name: "options",
    choices: [{
        name: "Convert NEXT to UAF",
        value: "next-to-uaf",
    }, 
    {
        name: "Convert UAF to NEXT",
        value: "uaf-to-next",
        disabled: "not available"
    },
    new inquirer.Separator(), 
    {
        name: "Fix JD+ bundles",
        value: "fix-jdp-bundles",
        disabled: "not available"
    },
    new inquirer.Separator(), 
    {
        name: "Fetch online catalog",
        value: "fetch-online-catalog",
        disabled: "not available"
    }]
}]

inquirer
    .prompt(options)
    .then(r => {
        let option = r.options
        
        let scriptPath = path.resolve(__dirname, "scripts", option + ".js")

        if (!fs.existsSync(scriptPath)) {
            global.logger.error(scriptPath, "is not an existing script! Exiting...")
            process.exit()
        }

        return require(scriptPath)()
    });