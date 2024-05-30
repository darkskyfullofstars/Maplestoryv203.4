const { remote, ipcRenderer, shell } = require('electron')
const ipcPromise = require('ipc-promise')
const win = remote.getCurrentWindow()
window.application = application = remote.getGlobal('application')
window.settings = settings = remote.getGlobal('settings')

window.openExternal = (url) => {
    shell.openExternal(url)
}

window.closeWin = () => {
    win.close()
}


window.listenToMain = function(topic, cb) {
    ipcRenderer.on(topic, (e, msg) =>{
        cb(msg)
    })
}

window.requestToMain = (topic, data = {}) => {
    return ipcPromise.send(topic, data)
}

window.openDevTools = () => {
    win.webContents.openDevTools()
}

window.launcherLanguageChange = (lang) => {
    requestToMain('broadcast', {'languageChange': lang})
}

// exposing some electron api
window.win = win

window.launcherData = win.params

window._preloadDir = __dirname

window.onkeydown = (evt) => {
    if (!settings.debug && evt.keyCode === 73 && evt.ctrlKey && evt.shiftKey) evt.preventDefault() // Ctrl + Shift + I - open dev tools
    if (evt.keyCode === 122 && !win.isResizable()) evt.preventDefault() // F11 - fullscreen
    if (evt.ctrlKey && evt.shiftKey && evt.keyCode == 187) evt.preventDefault() // Ctrl + Shift + (+)
    if (evt.ctrlKey && evt.keyCode == 189) evt.preventDefault() // Ctrl + (-)
    if (evt.ctrlKey && evt.keyCode == 48) evt.preventDefault() // Ctrl + 0
};