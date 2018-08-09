
const path = require('path')
var wechat_file = path.join(__dirname, './config/wechat.txt')
var util = require('./libs/util.js')

const config = {
	wechat: {
		appID: 'wx2671f3910b456b07',
		appSecret: '356307947aa76fd366070405e493211a',
		token: 'koa2test',
		getAccessToken() {
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken(data) {
			data = JSON.stringify(data)
			return util.writeFileAsync(wechat_file, data)
		}
	}
}

module.exports = config