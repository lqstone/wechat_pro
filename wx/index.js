
const path = require('path')
var wechat_file = path.join(__dirname, '../config/wechat.txt')
var wechat_ticket = path.join(__dirname, '../config/wechat_ticket.txt')
var util = require('../libs/util.js')
var Wechat = require('../wechat/wechat.js')

var config = {
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
		},
		getTicket() {
			return util.readFileAsync(wechat_ticket)
		},
		saveTicket(data) {
			data = JSON.stringify(data)
			return util.writeFileAsync(wechat_ticket, data)
		}
	}
}

// module.exports = config
// 
// 
exports.wechatOptions = config

exports.getWechat = function() {    // 实例wechat
	var wechatApi = new Wechat()
	return wechatApi
}