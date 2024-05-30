let prevstage = null;

const log = async ({stage, comment = '', error = null} = {}) => {
	if (!global.settings.stabilityMetrics || !stage) return Promise.resolve(false);
	let data = {
		createdate: new Date().toISOString(),
		currentstep: 2,
		nexonsn: global.settings.stabilityMetrics.uid || null,
		serviceid: global.settings.stabilityMetrics.serviceid,
		sessionid: global.settings.stabilityMetrics.sessionId,
		type: 'stability',
		stability: {
			comment,
			error: error ? 1 : -9999,
			prevstage,
			stage
		}
	}
	prevstage = stage;
	let response;
	try {
		response = await global.axios.post(global.settings.stabilityMetrics.url, data, {
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch(e) { // no propagation
		console.log(e);
	}
	return {
		request: {
			data
		},
		response
	}
}

module.exports = exports = {log}