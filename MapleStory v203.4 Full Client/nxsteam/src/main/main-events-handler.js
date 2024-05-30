
const { app, BrowserWindow } = require('electron')
const { gameLaunch } = require('./game-launch')
const ipcPromise = require('ipc-promise')
const stabilityMetrics = require('./stability-metrics')

ipcPromise.on('login', function(params) {
    global.session = params

    console.log('login => ', params)
    BrowserWindow.getAllWindows().forEach(win => {
        if(win.name === 'main') {
            win.send('navigateTo', 'connector')
        }
    })
    return Promise.resolve(true)
})

ipcPromise.on('gameLaunch', function(params) {
	return gameLaunch(params)
		.then((d) => {
			stabilityMetrics.log({stage: 700, comment: 'game client is launched'});
			return d;
		})
		.catch(e => {
			console.error(e)
			stabilityMetrics.log({stage: 700, comment: 'error occured during game launching' , error: 1});
			return Promise.reject(e)
		})
})

ipcPromise.on('broadcast', function(params) {
    for(var key in params) {
        BrowserWindow.getAllWindows().forEach(win => {
            win.send(key, params[key])
        })
    }
    return Promise.resolve(true);
})

ipcPromise.on('stabilityMetrics', (data) => {
	return stabilityMetrics.log(data);
})

ipcPromise.on('close', function() {
    app.quit()
    return Promise.resolve(true)
})