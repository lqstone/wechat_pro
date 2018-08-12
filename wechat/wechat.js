var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var config = require('../config.js')
var util = require('./util.js')
var fs = require('fs')
var _ = require('lodash')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: { // 临时
        upload: prefix + 'media/upload',

        fetch: prefix + 'media/get', // 获取
    },
    permanent: { // 永久 https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=ACCESS_TOKEN
        upload: prefix + 'material/add_material', // 新增其他类型永久素材
        uploadNews: prefix + 'material/add_news', // 新增永久图文素材
        uploadNewsPic: prefix + 'media/uploadimg', // 上传图文消息内的图片获取URL

        fetch: prefix + 'material/get_material', // 获取素材
        del: prefix + 'material/del_material', // 删除素材
        update: prefix + 'mmaterial/update_news', // 更新素材
    }
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
                console.log("uploadMaterial", _data)
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

module.exports = Wechat