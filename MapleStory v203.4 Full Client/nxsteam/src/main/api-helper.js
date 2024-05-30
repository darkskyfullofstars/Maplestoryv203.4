
const { app } = require('electron')
const axios = require('axios')
const https = require('https')
// const https = require('https')

const create = (options = {}) => {
	// to avoid self signed certificate error
	options.httpsAgent = new https.Agent({
		rejectUnauthorized: false
	})
	const instance = axios.create(options)

	instance.interceptors.response.use(response => {
		console.log('api call success: ', response.config.url, ' => ', response.data)
		return response.data;
	}, d => {
		if (d.response) {
			d = d.response;
			delete d.request;
		}
		console.error('api error: ', d.config.url, ', result data:', d.data)
		return Promise.reject(d);
	})

	instance.interceptors.request.use(config => {
		config.headers.common['User-Agent'] = `steam-connector ver: ${app.getVersion()}, electron: ${process.versions.electron}`;
		console.log('api call request - url: ', config.url, ' data: ', config.data);
		return config;
	});

	return instance
}

global.axios = create()

module.exports = global.axios