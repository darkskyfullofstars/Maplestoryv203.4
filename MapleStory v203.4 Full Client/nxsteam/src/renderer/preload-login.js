const { remote, ipcRenderer, shell } = require('electron')
const win = remote.getCurrentWindow()
const ipcPromise = require('ipc-promise')
settings = remote.getGlobal('settings')

let params = {
	client_id: '7853644408',
	scope: 'us.launcher.all'
}

window.launcherData = Object.assign(params, settings)

window.openExternal = (url) => {
	shell.openExternal(url)
}

window.requestToMain = (topic, data = {}) => {
	return ipcPromise.send(topic, data)
}

// login function
window.launcherLogin = (data) => {
	return ipcPromise.send('login', data)
}

window.launcherLoginCancel = () => {
	return ipcPromise.send('close', data)
}

window.launcherLoginFailure = () => {
	// todo
}

// language change function
window.launcherLanguageChange = (lang) => {
	requestToMain('broadcast', {'languageChange': lang})
}