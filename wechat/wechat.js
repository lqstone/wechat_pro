/*
    待办： 给promise加上异常捕获catch回调
    票据的获取
 */


var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var config = require('../config.js')
var util = require('./util.js')
var fs = require('fs')
var _ = require('lodash')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var semanticPrefix = 'https://api.weixin.qq.com/semantic/semproxy/search'   //  发送语义理解请求 接口


var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: { // 临时素材
        upload: prefix + 'media/upload',

        fetch: prefix + 'media/get', // 获取
    },
    permanent: { // 永久素材 https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=ACCESS_TOKEN
        upload: prefix + 'material/add_material', // 新增其他类型永久素材
        uploadNews: prefix + 'material/add_news', // 新增永久图文素材
        uploadNewsPic: prefix + 'media/uploadimg', // 上传图文消息内的图片获取URL

        fetch: prefix + 'material/get_material', // 获取素材
        del: prefix + 'material/del_material', // 删除素材
        update: prefix + 'material/update_news', // 更新素材

        count: prefix + 'material/get_materialcount', // 获取总数
        batch: prefix + 'material/batchget_material', // 获取素材列表
    },
    group: { // 用户管理 分组
        create: prefix + 'tags/create', // 创建标签
        fetch: prefix + 'tags/get', // 获取公众号已创建的标签
        check: prefix + 'tags/getidlist', //  获取用户身上的标签列表
        update: prefix + 'tags/update', //  编辑标签
        del: prefix + 'tags/delete', //  删除标签
        batchtag: prefix + 'tags/members/batchtagging', //   批量为用户打标签

    },
    user: {
        fetch: prefix + 'user/info', // 获取用户基本信息
        fetchList: prefix + 'user/get', // 获取用户列表
    },
    mass: {
        sendByGroup: prefix + 'message/mass/sendall', // 根据标签进行群发
    },
    menu: { 
        create: prefix + 'menu/create',
        get: prefix + 'menu/get',
        del: prefix + 'menu/delete',
        current: prefix + 'get_current_selfmenu_info',   // 获取自定义菜单配置接口
    },
    ticket: {
        get: prefix + 'ticket/getticket',  // 获取jsapi_ticket 
    }

}

function Wechat() {
    // body...
    // var that = this
    this.appID = config.wechat.appID
    this.appSecret = config.wechat.appSecret
    this.getAccessToken = config.wechat.getAccessToken
    this.saveAccessToken = config.wechat.saveAccessToken
    this.getTicket = config.wechat.getTicket
    this.saveTicket = config.wechat.saveTicket

    this.fetchAccessToken()

}

Wechat.prototype.fetchTicket = function(access_token) {
   
    return this.getTicket().then(data => {
            try {
                data = JSON.parse(data)
            } catch (e) {
                return this.updateTicket(access_token)
            }
            if (this.isValidTicket(data)) { // 判断合法性
                return Promise.resolve(data)
            } else {
                return this.updateTicket(access_token)
            }
        })
        .then((result) => {
            this.saveTicket(result)
            return Promise.resolve(result)
        })
}

Wechat.prototype.fetchAccessToken = function() {
    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {
            return Promise.resolve(this)
        }
    }
    return this.getAccessToken().then(data => {
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
            // data = JSON.parse(data)
            this.access_token = result.access_token
            this.expires_in = result.expires_in
            this.saveAccessToken(result)
            return Promise.resolve(result)
        })
}


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

/*
    获取token纸
 */
Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID
    var appSecret = this.appSecret
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret
    return new Promise((resolve, reject) => {
        request({
            url: url,
            json: true
        }).then((res) => { // 对get 和 post 封装过的库
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

/*
    获取ticket纸
 */

Wechat.prototype.isValidTicket = function(data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false
    }
    var ticket = data.ticket
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (ticket && now < expires_in) { // 检查过期时间
        return true
    } else {
        return false
    }
}

Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket.get + '?access_token=' + access_token + '&type=jsapi'
    return new Promise((resolve, reject) => {
        request({
            url: url,
            json: true
        }).then((res) => { 
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


/*
*	上传素材
	type: 上传类型
	material: 上传路径
	permanent： 判断临时or永久
*/
Wechat.prototype.uploadMaterial = function(type, material, permanent) {

    var form = {}
    var uploadUrl = api.temporary.upload

    if (permanent) {
        uploadUrl = api.permanent.upload
        _.extend(form, permanent)
    }

    if (type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic
    }

    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews
        form = material
    } else {
        form.media = fs.createReadStream(material)
    }

    // var form = {
    //     media: fs.createReadStream(material)
    // }

    // 
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = uploadUrl + '?access_token=' + data.access_token
            if (!permanent) {
                url += '&type=' + type
            } else {
                form.access_token = data.access_token
            }

            var options = {
                method: 'POST',
                url: url,
                json: true
            }
            if (type === 'news') {
                options.body = form
            } else {
                options.formData = form
            }
            request(options).then((res) => { // 
                var _data = res.body
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

// 获取
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var form = {}
    var fetchUrl = api.permanent.fetch

    if (permanent) {
        fetchUrl = api.permanent.fetch
    }
    // 
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var form = {
                media_id: mediaId,
                access_token: data.access_token
            }
            var url = fetchUrl + '?access_token=' + data.access_token
            var options = {
                method: 'POST',
                url: url,
                json: true
            }

            if (permanent) {
                form.media_id = mediaId
                form.access_token = data.access_token
                options.body = form
            } else {
                if (type === 'video') {
                    url = url.replace('https://', 'http://')
                }
                url += '&media_id=' + mediaId
            }

            if (type === 'news' || type === 'video') {
                request(options).then((res) => { // 
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
            } else {
                resolve(url)
            }

        })
    })
}

// 删除
Wechat.prototype.deleteMaterial = function(mediaId) {
    var form = {
        media_id: mediaId
    }
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.permanent.del + '?access_token=' + data.access_token + '&media_id=' + mediaId

            request({
                method: 'POST',
                url: url,
                body: form,
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

// 更新
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var form = {
        media_id: mediaId
    }
    _.extend(form, news)
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.permanent.update + '?access_token=' + data.access_token + '&media_id=' + mediaId

            request({
                method: 'POST',
                url: url,
                body: form,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("updateMaterial", _data)
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

// 获取总数
Wechat.prototype.countMaterial = function() {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.permanent.count + '?access_token=' + data.access_token

            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("countMaterial", _data)
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

// 获取素材列表
Wechat.prototype.batchMaterial = function(options) {

    options.type = options.type || 'image'
    options.offset = options.offset || 0
    options.count = options.count || 0

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.permanent.batch + '?access_token=' + data.access_token

            request({
                method: 'POST',
                body: options,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("batchMaterial", _data)
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

// 创建标签
Wechat.prototype.createGroup = function(name) {

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.group.create + '?access_token=' + data.access_token
            var options = {
                tag: {
                    name: name
                }
            }
            request({
                method: 'POST',
                body: options,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("createGroup", _data)
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

Wechat.prototype.fetchGroup = function() {

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.group.fetch + '?access_token=' + data.access_token

            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("fetchGroup", _data)
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

Wechat.prototype.checkGroup = function(openid) {

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.group.check + '?access_token=' + data.access_token
            var options = {
                openid: openid
            }
            request({
                method: 'POST',
                body: options,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("checkGroup", _data)
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

Wechat.prototype.batchTagGroup = function(openid_list, tagid) {

    var options = {}
    options.openid_list = openid_list || []
    options.tagid = tagid || ''


    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.group.batchtag + '?access_token=' + data.access_token

            request({
                method: 'POST',
                body: options,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("batchTagGroup", _data)
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

Wechat.prototype.fetchUser = function(openid) {

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.user.fetch + '?access_token=' + data.access_token + '&openid=' + openid + '&lang=zh_CN'

            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("fetchUser", _data)
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

Wechat.prototype.fetchListUser = function() {

    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.user.fetchList + '?access_token=' + data.access_token

            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("fetchListUser", _data)
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

/*
    {
    "filter":{
          "is_to_all":false,
          "tag_id":2
        },
        "mpnews":{
          "media_id":"123dsdajkasd231jhksad"
        },
        "msgtype":"mpnews",
        "send_ignore_reprint":0
        }
    }
 */
Wechat.prototype.sendByGroup = function(type, message, groupId) {

    var msg = {
        filter: {},
        msgtype: type,
    }
    msg[type] = message;

    if (!groupId) {
        msg.filter.is_to_all = true
    } else {
        msg.filter = {
            is_to_all: false,
            tag_id: groupId
        }
    }
    console.log('msg', msg)
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.mass.sendByGroup + '?access_token=' + data.access_token

            request({
                method: 'POST',
                url: url,
                body: msg,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("sendByGroup", _data)
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


Wechat.prototype.createMenu = function(menu) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.menu.create + '?access_token=' + data.access_token

            request({
                method: 'POST',
                body: menu,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("createMenu", _data)
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('createMenu fails')
                }
            }).catch((err) => {
                reject(err)
            })
        })
    })
}
Wechat.prototype.getMenu = function() {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.menu.get + '?access_token=' + data.access_token

            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("getMenu", _data)
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('getMenu fails')
                }
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

Wechat.prototype.deleteMenu = function() {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            console.log("data", data)
            var url = api.menu.del + '?access_token=' + data.access_token
            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("deleteMenu", _data)
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('delete Menu fails')
                }
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

Wechat.prototype.getCurrentMenu = function() {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = api.menu.current + '?access_token=' + data.access_token
            request({
                method: 'GET',
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("getCurrentMenu", _data)
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('getCurrent Menu fails')
                }
            }).catch((err) => {
                reject(err)
            })
        })
    })
}


Wechat.prototype.semantic = function(semanticData) {
    return new Promise((resolve, reject) => {
        this.fetchAccessToken().then((data) => { // 获取
            var url = semanticPrefix + '?access_token=' + data.access_token
            semanticData.appid = data.appID
            request({
                method: 'POST',
                body: semanticData,
                url: url,
                json: true
            }).then((res) => { // 
                var _data = res.body
                console.log("semantic", _data)
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('semantic fails')
                }
            }).catch((err) => {
                reject(err)
            })
        })
    })
}
module.exports = Wechat