// 存放app中的html代码
// 

var sha1 = require('sha1')
var crypto = require('crypto')
var ejs = require('ejs')
var heredoc = require('heredoc')
var wx = require('../wx/index.js')    // 实例化的wechat
var wechatApi = wx.getWechat()

// 生成随机字符串
var createNonce = function() {
	return Math.random().toString(36).substr(2, 15)
}
// 生成时间戳
var createTimestap = function() {
	return parseInt(new Date().getTime() / 1000, 10) + ''
}
// 签名算法
var _sign = function(noncestr, ticket, timestamp, url) {
	var params = [
		'noncestr=' + noncestr,
		'jsapi_ticket=' + ticket,
		'timestamp=' + timestamp,
		'url=' + url
	]
	var str = params.sort().join('&')
	console.log('str==============', str)
	var shasum = crypto.createHash('sha1')
	shasum.update(str)
	return shasum.digest('hex')
}
// 实现签名算法
function sign(ticket, url) {
	console.log("ticket====================", ticket)
	console.log("url=======================", url)
	var noncestr = createNonce()
	var timestamp = createTimestap()
	var signature = _sign(noncestr, ticket, timestamp, url)
	return {
		noncestr: noncestr,
		timestamp: timestamp,
		signature: signature,
	}
}

// app.use(async (ctx, next) => {
// 	console.log('ctx.url=============', ctx.url)

// 	if (ctx.url.indexOf('/movie') > -1) {
// 		var wechatApi = new Wechat()
// 		var data = await wechatApi.fetchAccessToken()
// 		console.log('fetchAccessToken================', ticketData)
// 		var access_token = data.access_token
// 		var ticketData = await wechatApi.fetchTicket(access_token)
// 		console.log('ticketData================', ticketData)
// 		var ticket = ticketData.ticket
// 		var url = ctx.href
// 		var params = sign(ticket, url)
// 		ctx.body = ejs.render(tpl, params)
// 		return next()
// 	}
// 	await next();
// })

exports.movie = async function(ctx, next) {
	// var wechatApi = new Wechat()
	var data = await wechatApi.fetchAccessToken()
	console.log('fetchAccessToken================', ticketData)
	var access_token = data.access_token
	var ticketData = await wechatApi.fetchTicket(access_token)
	console.log('ticketData================', ticketData)
	var ticket = ticketData.ticket
	var url = ctx.href
	var params = sign(ticket, url)
	params.title = "电影搜索"
	// ctx.body = ejs.render(tpl, params)
	await ctx.render('films', params)
}
