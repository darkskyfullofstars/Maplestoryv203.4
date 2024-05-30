const { app, session } = require('electron')

session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = `steam-connector/${app.getVersion()}, electron/${process.versions.electron}`;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
