
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var config = require('../config.js')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
  accessToken: prefix + 'token?grant_type=client_credential'
}

function Wechat(argument) {
  // body...
  // var that = this
  this.appID = config.wechat.appID
  this.appSecret = config.wechat.appSecret
  this.getAccessToken = config.wechat.getAccessToken
  this.saveAccessToken = config.wechat.saveAccessToken

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

Wechat.prototype.updateAccessToken = function() {
  var appID = this.appID
  var appSecret = this.appSecret
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret
  console.log("url-----------", url)
  return new Promise((resole, reject) => {
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
      resole(data)
    })
  })
}


module.exports = Wechat