const {app} = require('electron')
const bootup = require('./main/init')
const {open_window} = require('./main/windows-handler')
const stabilityMetrics = require('./main/stability-metrics')

global.application = {
  errors: []
}

console.info('app ver: ', app.getVersion())

process.on('uncaughtException', function (error) {
	// Handle the error
	console.error(error)
	global.application.errors.push(error)
	open_window('404')
	// ?? plex error report
})

const appReady = function() {
	if(app.isReady())
		return Promise.resolve(0)
	return new Promise(resolve => {
		app.once('ready', function() {
			console.log('electron app is ready')
			resolve(1)
		})
	})
}

Promise.all([
		appReady(),
		bootup()
	])
	.then(() => {
		require('./main/session')
		console.log('steam connector app is ready', global.settings)
		open_window('main')
		stabilityMetrics.log({stage: 100, comment: 'steam connector is initialized'})
	}, e => {
		console.error('init failed', e)
		stabilityMetrics.log({stage: 100, comment: 'steam connector is initialized', error: 1})

		if (isNaN(e)) {
			// need to send an error log to plex
			e = 11000;
		}
		appReady().then(() => {
			open_window('404', {params: { errorCode: e}})
		})
	})

app.on('web-contents-created', (event, contents) => {
	contents.on('new-window', (e, url) => {
		e.preventDefault()
		shell.openExternal(url)
	});
	contents.on('will-navigate', (e, url) => { // prevent to change a window location except hash change and except by win.loadURL()
		console.log('will-navigate event -', contents.id, url)
		e.preventDefault()
	});
})


app.on('window-all-closed', function () {
	app.quit()
})