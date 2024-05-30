const greenworks = require('greenworks');
let isInit = false;
let initResult;
function init() {
    if(!isInit) {
        isInit = true
        initResult = greenworks.initAPI()
    }
    return initResult
}

function checkInternet(cb) {
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}

const getAuthSessionTicket = function() {
    return new Promise((resolve, reject) => {
		if(!init()) {
			reject(10001)
			return
		}
		checkInternet((isInternet) => {
			if (!isInternet) {
				reject(20000)
				return
			}

			greenworks.getAuthSessionTicket(d => {
				resolve(d.ticket.toString('hex'))
			}, e => {
				console.error(e)
				reject(10010)
			})
		})
    })
}

const lang_table = {
    'arabic':'ar',
    'bulgarian':'bg',
    'schinese':'zh-CN',
    'tchinese': 'zh', // 'zh-TW',
    'czech':'cs',
    'danish':'da',
    'dutch':'nl',
    'english':'en',
    'finnish':'fi',
    'french':'fr',
    'german':'de',
    'greek':'el',
    'hungarian':'hu',
    'italian':'it',
    'japanese':'ja',
    'koreana':'ko',
    'norwegian':'no',
    'polish':'pl',
    'portuguese':'pt',
    'brazilian':'pt', // 'pt-BR',
    'romanian':'ro',
    'russian':'ru',
    'spanish':'es',
    'swedish':'sv',
    'thai':'th',
    'turkish':'tr',
    'ukrainian':'uk'
}

const getCurrentUILangCode = function() {
    let language = greenworks.getCurrentUILanguage()
    return lang_table[language] || 'en'
}

module.exports = { getAuthSessionTicket, getCurrentUILangCode, greenworks }