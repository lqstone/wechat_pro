var Koa = require('koa')
var router = require('koa-router')() /*引入是实例化路由** 推荐*/
var crypto = require('crypto')
var sha1 = require('sha1')
var wechat = require('./wechat/g.js')
var reply = require('./wx/reply.js') // 处理微信逻辑
var app = new Koa()
var Wechat = require('./wechat/wechat.js')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
// var wechatApi = new Wechat()
var ejs = require('ejs')
var heredoc = require('heredoc')

var tpl = heredoc(function() {
	/*
	    <!DOCTYPE html>
	    <html>
	    <head>
	    	<meta charset="utf-8">
	    	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	    	<meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1"
	    	<title>猜电影</title>
	    	<link rel="stylesheet" href="">
	    </head>
	    <body>
	    	<div id="voice">点击标题，开始录音翻译</div>
	    	<p id="title"></p>
	    	<p id="directors"></p>
	    	<p id="images"></p>
	    	<div id="year"></div>
	    </body>
	    <script src="http://zeptojs.com/zepto-docs.min.js"></script>
	    <script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
	    <script>

	    wx.config({
	        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
	        appId: 'wx2671f3910b456b07', // 必填，公众号的唯一标识
	        timestamp: "<%= timestamp %>", // 必填，生成签名的时间戳
	        nonceStr: "<%= noncestr %>", // 必填，生成签名的随机串
	        signature: "<%= signature %>",// 必填，签名
	        jsApiList: [
	    		'startRecord',
	    		'stopRecord',
	    		'onVoiceRecordEnd',
				'translateVoice',
				'previewImage',
				'onMenuShareAppMessage',
	        ] // 必填，需要使用的JS接口列表
	    });


	    wx.ready(function(){
	    	wx.checkJsApi({
	    	    jsApiList: ['onVoiceRecordEnd'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
	    	    success: function(res) {
	    	    	console.log(res)
	    	    // 以键值对的形式返回，可用的api值true，不可用为false
	    	    // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
	    	    }
			});
			wx.onMenuShareAppMessage({
				title: '分享标题', 
				desc: '这是个豆瓣电影链接', 
				link: 'http://847a5280.ngrok.io/movie',
				imgUrl: 'www.baidu.com/img/bd_logo1.png?where=super',
				success: function () {
					alert('分享成功')
				},
				cancel: function() {
					alert('分享失败')
				}
			});
			var isRecording = false;
			var slides = {};
			
	    	$('#images').on('tap', function(){
				wx.previewImage(slides);
			})
	    	$('#voice').on('tap', function(){
	    		if (!isRecording) {
	    			isRecording = true;
	    			wx.startRecord({
	    				cancel: function(){
	    					alert('取消授权')
	    				}
	    			})
	    			return;
	    		}
	    		isRecording = false
	    		wx.stopRecord({
	    			success: function (res) {
	    				var localId = res.localId;
	    				wx.translateVoice({
	    					localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
	    					isShowProgressTips: 1, // 默认为1，显示进度提示
	    					success: function (res) {
								// alert(res.translateResult); // 语音识别的结果
								
								$.ajax({
									type: "GET",
									url: 'https://api.douban.com/v2/movie/search?q=' + res.translateResult,
									dataType: 'jsonp',
									jsonp: 'callback',
									success: function(data){
										var subject = data.subjects[0]
										$('#title').html(subject.title)
										$('#directors').html(subject.directors[0].name)
										$('#images').html('<img src="'+ subject.images.medium + '">')
										$('#year').html(subject.year)
										slides = {
											current: subject.images.large,
											urls: []
										}
										data.subjects.forEach(function(item){
											slides.urls.push(item.images.large)
										})
										
									}
								})
	    					}
	    				});
	    			}
	    		});
	    	})
	    })


	    </script>
	    </html>
	    */
})

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

/*
	路由页面
 */


app.use(async (ctx, next) => {
	console.log('ctx.url=============', ctx.url)

	if (ctx.url.indexOf('/movie') > -1) {
		var wechatApi = new Wechat()
		var data = await wechatApi.fetchAccessToken()
		console.log('fetchAccessToken================', ticketData)
		var access_token = data.access_token
		var ticketData = await wechatApi.fetchTicket(access_token)
		console.log('ticketData================', ticketData)
		var ticket = ticketData.ticket
		var url = ctx.href
		var params = sign(ticket, url)
		ctx.body = ejs.render(tpl, params)
		return next()
	}
	await next();
})



app.use(wechat(reply.reply)) // 业务逻辑传给weixin.reply来处理
router.get('/', async (ctx) => {
	ctx.body = "首页"
})
router.get('/news', async (ctx) => {
	ctx.body = '这是一个新闻'
})










// 网页授权获取微信用户详细信息
router.get('/getUserInfo', async (ctx) => {
	ctx.body = '获取用户信息'
	let redirect = 'http://7b425b68.ngrok.io/userInfo'; //剪贴code至开发本地测试
	let SCOPE = 'snsapi_userinfo'; //获取授权 用户有感知！
	let _url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2671f3910b456b07&redirect_uri=${redirect}&response_type=code&scope=${SCOPE}&state=STATE#wechat_redirect`;
	ctx.redirect(_url)
})

router.get('/userInfo', async (ctx) => {
	var getCode = function() {
		return new Promise(function(resolve, reject) {
			var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx2671f3910b456b07&secret=356307947aa76fd366070405e493211a&code=' + ctx.query.code + '&grant_type=authorization_code';
			request({
				method: 'GET',
				url: url,
				json: true
			}).then((res) => { // 
				var _data = res.body
				if (_data) {
					resolve(_data)
				} else {
					throw new Error('获取网页access_token fails')
				}
			}).catch((err) => {
				reject(err)
			})
		})
	}

	var wechatUserInfo = function(web_access_token, openId) {
		return new Promise(function(resolve, reject) {
			var url = 'https://api.weixin.qq.com/sns/userinfo?access_token='+ web_access_token +'&openid='+ openId +'&lang=zh_CN';
			request({
				method: 'GET',
				url: url,
				json: true
			}).then((res) => { // 
				var _data = res.body
				if (_data) {
					resolve(_data)
				} else {
					throw new Error('获取用户信息 fails')
				}
			}).catch((err) => {
				reject(err)
			})
		})
	}

	async function getUserInfo() {
		var web_access_token = await getCode()
		console.log(1111111111111111111111, web_access_token)
		var userInfo = await wechatUserInfo(web_access_token.access_token, web_access_token.openid)
		console.log(222222222222222222222, userInfo)
	}

	ctx.body = '获取信息成功'
	getUserInfo()
})







app.use(router.routes()) /*启动路由*/
app.use(router.allowedMethods())
app.listen(3000)