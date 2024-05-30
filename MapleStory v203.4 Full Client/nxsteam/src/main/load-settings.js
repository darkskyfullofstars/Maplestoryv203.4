const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const path = require('path')

const default_settings = {
	"env": "live",
	"web_host": "https://web.nxfs.nexon.com",
	"api_host":"https://api.nexon.io",
	"accounts_host": "https://www.nexon.com",
	"languages": [
		"es-419",
		"en-US",
		"pt-BR",
		"de-DE",
		"fr-FR",
		"it-IT",
		"pl-PL",
		"tr-TR"
	]
}

const settingsFilePath = path.normalize(process.cwd() + '/steam_connector_config.json')

async function loadSettings() {
	let settings = Object.assign({}, default_settings)
	try {
		let buf = await readFile(settingsFilePath)
		let json = JSON.parse(buf.toString())

		if(json.env) {
			for(let key in settings) {
				settings[key] = settings[key].replace('https://', 'https://' + json.env + '-')
			}
		}

		settings = Object.assign(settings, json)
	}
	catch(e) {
		console.error(e)
		throw new Error(10002) // error code
	}

	return settings
}

module.exports = loadSettings()