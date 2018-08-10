var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var config = require('../config.js')
var util = require('./util.js')
var fs = require('fs')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
	accessToken: prefix + 'token?grant_type=client_credential',
	upload: prefix + 'media/upload'
}

function Wechat() {
	// body...
	// var that = this
	this.appID = config.wechat.appID
	this.appSecret = config.wechat.appSecret
	this.getAccessToken = config.wechat.getAccessToken
	this.saveAccessToken = config.wechat.saveAccessToken

	this.fetchAccessToken()

}

Wechat.prototype.fetchAccessToken = function() {
	if (this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this)
		}
	}
	this.getAccessToken().then(data => {
			try {
				data = JSON.parse(data)
			} catch (e) {
				return this.updateAccessToken(data)
			}
			console.log('this.isValidAccessToken(data)', this.isValidAccessToken(data))
			if (this.isValidAccessToken(data)) { // 判断合法性
				return Promise.resolve(data)
			} else {
				return this.updateAccessToken()
			}
		})
		.then((result) => {
			// console.log(1111111111111, result)
			// data = JSON.parse(data)
			this.access_token = result.access_token
			this.expires_in = result.expires_in
			this.saveAccessToken(result)
			return Promise.resolve(result)
		})
}

/*
	获取token纸
 */
Wechat.prototype.isValidAccessToken = function(data) {
	if (!data || !data.access_token || !data.expires_in) {
		return false
	}
	var access_token = data.access_token
	var expires_in = data.expires_in
	var now = (new Date().getTime())

	if (now < expires_in) { // 检查过期时间
		return true
	} else {
		return false
	}
}

Wechat.prototype.updateAccessToken = function() {
	var appID = this.appID
	var appSecret = this.appSecret
	var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret
	console.log("url-----------", url)
	return new Promise((resolve, reject) => {
		request({
			url: url,
			json: true
		}).then((res) => { // 对get 和 post 封装过的库
			console.log(2222222222222222, res)
			// {
			//   errcode: 40013,
			//   errmsg: 'invalid appid hint: [5TkgQA00083612]',
			//   expires_in: NaN
			// }
			var data = res.body
			var now = (new Date().getTime())
			var expires_in = now + (data.expires_in - 20) * 1000

			data.expires_in = expires_in
			resolve(data)
		})
	})
}

// 回复
Wechat.prototype.reply = function() {
	var content = this.body // 这个body是undefined
	var message = this.weixin
	var xml = util.tpl(content, message)

	this.status = 200
	this.type = 'application/xml'
	this.body = xml
}

// 上传素材
Wechat.prototype.uploadMaterial = function(type, filepath) {

	var form = {
		media: fs.createReadStream(filepath)
	}

	// 
	return new Promise((resolve, reject) => {
		this.fetchAccessToken().then((data) => { // 获取
			var url = api.upload + '?access_token=' + data.access_token + '&type=' + type
			request({
				method: 'POST',
				url: url,
				formData: form,
				json: true
			}).then((res) => { // 
				var _data = res.body
				console.log(11111, _data)
				if (_data) {
					resolve(_data)
				} else {
					throw new Error('upload material fails')
				}
			}).catch((err) => {
				reject(err)
			})
		})
	})
}

module.exports = Wechat