/*
	微信的所有业务逻辑
 */
var Wechat = require('../wechat/wechat.js')
var wechatApi = new Wechat()
var menu = require('./menu.js')
var path = require('path')



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
        } else if (content === '5') { // 新增临时素材图片
            var data = await wechatApi.uploadMaterial('image', path.join(__dirname + '../2.png'))
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        } else if (content === '6') { // 新增临时素材视频
            var data = await wechatApi.uploadMaterial('video', path.join(__dirname + '../2.mp4'))
            reply = {
                type: 'video',
                title: '这个是个视频文件',
                description: '这是个视频简介',
                mediaId: data.media_id
            }
        } else if (content === '7') { // 永久素材的测试
            var picData = await wechatApi.uploadMaterial('image', path.join(__dirname + '../2.png'), {}) // 上传永久
            var media = {
                articles: [{
                    title: '哈哈哈',
                    thumb_media_id: picData.media_id,
                    author: 'stone',
                    digest: '没有假药',
                    show_cover_pic: 1,
                    content: '没有内推',
                    content_source_url: 'https://github.com',
                }]
            }
            data = await wechatApi.uploadMaterial('news', media, {})
            data = await wechatApi.fetchMaterial(data.media_id, 'news', {})
            console.log("获取的信息", data)
            var items = data.news_item
            var news = []
            items.forEach(function(item) {
                news.push({
                    title: item.title,
                    description: item.digest,
                    picUrl: picData.url,
                    url: item.url,
                })
            })
            reply = news
        } else if (content === '8') { // 素材的获取统计
            var count = await wechatApi.countMaterial()
            console.log(12121212, JSON.stringify(count))
            var list = await wechatApi.batchMaterial({
                type: 'news',
                offset: 0,
                count: 10
            })
            console.log(12121212, JSON.stringify(list))
        } else if (content === '9') { // 创建用户分组
            var data = await wechatApi.createGroup('VIP用户')
            console.log("创建用户分组", JSON.stringify(data))

        } else if (content === '9-1') { // 查询用户分组
            var data = await wechatApi.fetchGroup()
            console.log("查询用户分组", JSON.stringify(data))

        } else if (content === '9-2') { // 查询用户所在组
            var data = await wechatApi.checkGroup('ogQVX1KXDhDAUtqETox238GX1jYk')
            console.log("查询用户所在组", JSON.stringify(data))

        } else if (content === '9-3') { // 为用户list设置分组
            var data = await wechatApi.batchTagGroup(['ogQVX1KXDhDAUtqETox238GX1jYk'], 100)
            console.log("为用户list设置分组", JSON.stringify(data))

        } else if (content === '10') { // 获取用户基本信息
            var data = await wechatApi.fetchUser('ogQVX1KXDhDAUtqETox238GX1jYk')
            console.log("获取用户基本信息", JSON.stringify(data))

        } else if (content === '10-1') { // 获取用户列表
            var data = await wechatApi.fetchListUser()
            console.log("获取用户列表", JSON.stringify(data))

        } else if (content === '11') { // 群发信息 text
            var data = await wechatApi.sendByGroup('text', {
                content: '那我就随便该店东西试试行不行'
            })
            console.log("群发信息", JSON.stringify(data))

        } else if (content === '11-1') { // 群发信息 图文
            var data = await wechatApi.sendByGroup('mpnews', {
                media_id: 'zYjFTc1_E7H628g6UT_eCd4l3f35Fc_uJGLVSs_7RxY'
            })
            console.log("群发图文信息", JSON.stringify(data))
            reply = '123'

        } else if (content === '0') { // 群发信息 图文
            wechatApi.deleteMenu().then(() => {
                return wechatApi.createMenu(menu)
            }).then((msg) => {
                console.log("创建菜单", msg)
            })

        }else if (content === '12') { // 群发信息 图文
            var semanticData = {
                query: '查一下明天从北京到上海的南航机票',
                city: '深圳',
                category: 'flight,hotel',
                uid: message.FromUserName
            }
            var data = await wechatApi.semantic(semanticData)
            console.log("创建菜单", JSON.stringify(data))
            reply = JSON.stringify(data)
       
        }



        this.body = reply
    }

    await next()
}