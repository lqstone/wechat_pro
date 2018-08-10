/*
	微信的所有业务逻辑
 */
var Wechat = require('./wechat/wechat.js')
var wechatApi = new Wechat()

exports.reply = async function(next) {
	var message = this.weixin // 获取消息
	console.log("微信业务逻辑：", message)
	if (message.MsgType === 'event') {
		if (message.Event === 'subscribe') { // 关注
			if (message.EventKey) {
				console.log('扫二维码进来的：', message.EventKey + '' + message.ticket)
			}

			this.body = "大傻吊，大猪蹄子，你的关注你大哥刘巧的这个公众号\r\n刚刚了解了下微信公众号的开发，做了点机器人回复\r\n试试回复\r\n1\r\n2\r\n3\r\n4\r\n你敢他妈的试试？\r\n这是你的微信生成的ID，我悄悄咪咪告诉你：" + message.FromUserName

		} else if (message.Event === 'unsubscribe') { // 取消关注
			console.log("已经取消关注")
			this.body = ""
		} else if (message.Event === 'location') {
			this.body = "您的位置是：" + message.Latitude + '/' + message.Longitude + '_' + message.Precison

		} else if (message.Event === 'CLICK') {
			this.body = "您点击了菜单：" + message.EventKey
		} else if (message.Event === 'SCAN') {
			console.log("关注后扫二维码：" + message.EventKey + '' + message.Ticket)
			this.body = '看到你扫了一下'
		} else if (message.Event === 'VIEW') {
			this.body = "您点击了菜单中的链接：" + message.EventKey
		}
	} else if (message.MsgType === 'text') {
		var content = message.Content
		var reply = '你说的是：' + message.Content + '。但是太复杂了，听不懂！'
		if (content === '1') {
			reply = "这是1的反应"
		} else if (content === '2') {
			reply = "这是2的反应"
		} else if (content === '3') {
			reply = "这是3的反应"
		} else if (content === '4') {
			reply = [{
				title: '小伙，你太赞了！！！',
				description: '关于你的自我认识你需要好好了解下，真的哦，不是我欺负你。',
				picUrl: 'http://mmbiz.qpic.cn/mmbiz_jpg/pVcKPKpQwcN8DWaUUAYtOdhgd2yoFPl1Ke21pe1ibmsJtb3sZNDnAjrtsz48aSRyfPX3quhepWwicXsOB8DzIYicw/0',
				url: 'https://www.bilibili.com/',
			}]
		} else if (content === '5') {     // 新增临时素材图片
			var data = await wechatApi.uploadMaterial('image', __dirname + '/2.png')
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '6') {    // 新增临时素材视频
			var data = await wechatApi.uploadMaterial('video', __dirname + '/2.mp4')
			reply = {
				type: 'video',
				title: '这个是个视频文件',
				description: '这是个视频简介',
				mediaId: data.media_id
			}
		}
		this.body = reply
	}

	await next()
}