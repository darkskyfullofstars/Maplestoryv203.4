require('./api-helper')	// axios init
const fs = require('fs')
const util = require('util')
const deviceid = require('./deviceid')
const uuidv4 = require('uuid/v4')
const loadSettings = require('./load-settings')
const steam = require('./steam-helper')
require('./main-events-handler')

let logFile = null
var logStdout = process.stdout;

const logger = (title) => {
	return (...args) => {
		if (!logFile) {
			logFile = fs.createWriteStream('steam-connector.log', { flags: 'w' }) // 'w' to truncate the file every time the process starts.
		}
		const strLine = `${new Date().toISOString()} : ${title} : ${util.format.apply(null, args)}\n`;
		logFile.write(strLine)
		logStdout.write(strLine)
	}
}

console.info = logger('info')
console.error = logger('error')

loadSettings.then(settings => {
	if (settings.debug) {
		console.log = logger('debug')
	}
})

module.exports = async () => {
	return await Promise.all([
		loadSettings,
		steam.getAuthSessionTicket(),
		deviceid()
	]).then(d => {
		const settings = d[0]
		const appID = steam.greenworks.getAppId()

		let lang = steam.getCurrentUILangCode()
		if (!settings.languages.find((el) => { return el.indexOf(lang) > -1 })) {
			lang = 'en' // default language
		}

		if (settings.stabilityMetrics && !settings.stabilityMetrics.sessionId) {
			settings.stabilityMetrics.sessionId = uuidv4().replace(/-/g, '')
		}

		global.settings = Object.assign({}, settings, {
			lang,
			appID,
			steamSessionTicket: d[1],
			device_id: d[2],
		});

	})
}
