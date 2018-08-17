var Koa = require('koa')
var reply = require('./wx/reply.js') // 处理微信逻辑
var app = new Koa()
// var Wechat = require('./wechat/wechat.js')
var wechat = require('./wechat/g.js')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
// var wechatApi = new Wechat()
var wx = require('./wx/index.js')    // 实例化的wechat
console.log("wx from app ====", wx)
var wechatApi = wx.getWechat()

/*
	初始化菜单
 */
var menu = require('./wx/menu.js')
wechatApi.deleteMenu().then(() => {
    return wechatApi.createMenu(menu)
}).then((msg) => {
    console.log("创建菜单", msg)
})


var router = require('koa-router')() /*引入是实例化路由** 推荐*/
var game = require('./controller/game.js')

router.get('/movie', game.movie)

/*
	路由页面
 */

app.use(wechat(reply.reply)) // 业务逻辑传给weixin.reply来处理

// router.get('/wechat', wechat.hear)
// router.post('/wechat', wechat.hear)


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