const { spawn } = require('child_process')
const stabilityMetrics = require('./stability-metrics')

const checkPlayable = async function() {
	try {
		const response = await global.axios.post(global.settings.api_host + '/game-auth/v2/check-playable', {
				id_token: global.session.id_token,
				product_id: global.settings.appID,
				device_id: global.settings.device_id,
				is_steam: true
			});
		global.settings.app.product_id = response.product_id;
		stabilityMetrics.log({stage: 600, comment: 'check playable'});

		return response;
	} catch(e) {
		stabilityMetrics.log({stage: 600, comment: 'check playable - error', error: 1});
		throw e;
	}
}

const getGameTicket = async function() {
	await checkPlayable();
	try {
		const response = await global.axios.post(global.settings.api_host + '/game-auth/v2/ticket', {
				id_token: global.session.id_token,
				product_id: global.settings.app.product_id,
				device_id: global.settings.device_id,
				is_steam: true
			});
		if(response.ticket) {
			stabilityMetrics.log({stage: 610, comment: 'get a ticket'});
			return response.ticket
		}
	} catch(e) {
		stabilityMetrics.log({stage: 610, comment: 'get a ticket - error', error: 1});
		throw e;
	}
	stabilityMetrics.log({stage: 610, comment: 'get a ticket - no ticket returned', error: 1});
	return Promise.reject({error: {code: 10020, message: 'failed to find out a ticket data from successful response'}})
}

// singletone b/c userno won't be changed within same session
const getUserNo = async function() {
	if (!global.session) return null;
	if (!global.session.nexon_uid) {
		const res = await global.axios.get(global.settings.api_host + '/users/me/profile', {
			headers: {
				'Authorization': 'Bearer ' + Buffer.from(global.session.access_token).toString('base64')
			}
		})
		global.session.nexon_uid = res.user_no;
	}

	return global.session.nexon_uid;
}

const getPassportString = async function(keep_alive_for=1200) {
	const response = await global.axios.get(global.settings.api_host + '/users/me/passport', {
		headers: {
			'Authorization': 'Bearer ' + Buffer.from(global.session.access_token).toString('base64')
		}
	})

	return response.passport
}

/// return: array
const swapArgsFunc = async function(args, keyword, asyncFunc) {

	let index = args.findIndex(x => x.indexOf(keyword) >= 0)
	if (index >= 0) {
		const ticket = await asyncFunc()
		while (index >= 0) {
			args[index] = args[index].replace(keyword, ticket)
			index = args.findIndex(x => x.indexOf(keyword) >= 0, index)
		}
	}
}

const getExecArgsResolve = async function() {
	let params = global.settings.app.exec_parameters || []
	if (!Array.isArray(params)) {
		params = params.split(' ')
	}
	let promises = [
		swapArgsFunc(params, '{gameAuthTicket}', getGameTicket),
		swapArgsFunc(params, '{userNo}', getUserNo),
		swapArgsFunc(params, '{passport}', getPassportString),
		swapArgsFunc(params, '{lang}', () => global.settings.lang)];
	if (global.settings.stabilityMetrics) {
		global.settings.stabilityMetrics.uid = await getUserNo()
		promises.push(swapArgsFunc(params, '{tracking_serviceid}', () => global.settings.stabilityMetrics.serviceid))
		promises.push(swapArgsFunc(params, '{tracking_sessionid}', () => global.settings.stabilityMetrics.sessionId))
		promises.push(swapArgsFunc(params, '{tracking_uid}', () => global.settings.stabilityMetrics.uid))
	}
	await Promise.all(promises)

	return params
}

const gameLaunch = async function() {
	const execPath = global.settings.app.exec_path
	const opts = global.settings.app.exec_options || {}
	const args = await getExecArgsResolve()

	const cp = spawn(`"${execPath}"`, args, Object.assign({ shell: true }, opts));

	cp.stdout.on('data', (d) => {
		console.log('stdout: ', d.toString());
    })
    cp.stderr.on('data', (d) => {
		const err = d.toString();
		console.error('stderr: ', err);
		// BrowserWindow.getAllWindows().forEach(win => {
		// 	if(win.name === 'main') {
		// 		win.send('gameLaunchError', err)
		// 	}
		// })
	})
	cp.on('error', (code) => {
		console.log('gameLaunch error: ', code)
	})
	cp.on('close', (code) => {
		if (code !== 0) {
			console.error('gameLaunch closed: ', code)
		}
	})
}

module.exports = { gameLaunch, getUserNo }