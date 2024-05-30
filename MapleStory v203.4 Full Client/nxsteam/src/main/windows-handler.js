if(global._windows) return; // singletone
const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')

global._windows = {}

let switch_to_404 = function(win) {
	create_window('404')
	win.close()
}

// singleton
let create_window = function(name, {params = {}, showWhenReady = true} = {}) {
	if(name in  global._windows) {
		return global._windows[name]
	}
	let _path = ''
	let options = {
		frame: false,
		show: false,
		center: true,
		backgroundColor: '#292c33',
		resizable: false,
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, '../renderer/preload.js')
		}
	}

	let winState;

	switch (name) {
		case '404':
			_path = path.normalize(path.join(__dirname, '../template/noservice.html'))
			_path += '?' + Object.keys(params).map(key => key + '=' + params[key]).join('&')
			break
		case 'main':
			options.webPreferences.webviewTag = true; // in order to implement a webview
			// options.resizable = true
			options.width = 800
			options.height = 620
			_path = global.settings.web_host + '/steam-connector-web/dynamic/index-1.0.html';
			break;
		default:
			console.error('window name is not valid: ', name)
			return;
	}

	let win = new BrowserWindow(options)
	win.name = name
	win.state = 'init'
	win.path = _path
	console.log('create_window => ', name, _path)
	win.webContents.on('did-get-response-details', (event, status, newUrl, originalUrl, httpCode) => {
		if(originalUrl !== _path) return
		if(httpCode !== 200) {
			console.log(originalUrl, "=======> Error: ", httpCode)
			if(name !== '404') {
				switch_to_404(win)
			}
		}
	})
	win.webContents.on('did-fail-load', (event, code, errorStr, url, isMainFrame) => {
		console.log('did-fail-load', code, errorStr, url)
		switch_to_404(win)
	})
	win.loadURL(_path)
	win.state = 'loading'

	// win.webContents.openDevTools()
	if(winState)  winState.manage(win)

	win.webContents.once('did-finish-load', () => {
		if(win.state !== 'loading') return
		win.state = 'loaded'
		if(showWhenReady) {
			win.show()
		}
		// console.log('did-finish-load', name, _path)
	})

	win.webContents.on('destroyed', () => {
		console.log('window is destroyed - ', name)
		delete global._windows[name];
	})

	global._windows[name] = win

	return win
}

let send_params_window = function(win, params) {
	if(!params) return
	win.params = params
	win.webContents.send('params', params)
	console.log('send_params_window', params)
}

let open_window = function(name, { params = null, showWhenReady = true} = {}) {
	console.log('open_window => ', name)

	let win = create_window(name, {params, showWhenReady})

	if(!win) {
		console.error('cannot create a window')
		return null
	}
	if(win.state == 'loaded') // already created one
	{
		win.show(); // focus
	}

	if(params)
		send_params_window(win, params)
	return win
}

let get_window = function(name) {
	if(name in  global._windows) {
		return global._windows[name]
	}
	return null
}

ipcMain.on('nxl:open_window', (event, name, params) => {
	event.returnValue = open_window(name, { params })
})

module.exports = {open_window, create_window, get_window}