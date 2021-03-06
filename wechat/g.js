/*
  封装链接微信为中间件
 */

var sha1 = require('sha1')
var config = require('../config.js')
var Wechat = require('./wechat.js')
var getRawBody = require('raw-body')
var util = require('./util.js')
// var handler = require()

//  signature: '692ac6f55cbfacbc9a9faf76dac8fc34ae3bf8cd',
//  echostr: '3420778034199525051',
//  timestamp: '1533712032',
//  nonce: '135059459'


module.exports = (handler) => {
  var wechat = new Wechat()
  return async (ctx, next) => {
    console.log("ctx.query", ctx.query)
    var token = config.wechat.token
    var signature = ctx.query.signature
    var nonce = ctx.query.nonce
    var timestamp = ctx.query.timestamp
    var echostr = ctx.query.echostr
    var str = [token, timestamp, nonce].sort().join('')
    var sha = sha1(str)
    if (ctx.method === 'GET') {
      if (sha === signature) {
        ctx.body = echostr + ''
      } else {
        return await next();
      }
    } else if (ctx.method === 'POST') {
      if (sha !== signature) {
        ctx.body = "wrong"
        return await next();
      }

      var data = await getRawBody(ctx.req, {
        length: ctx.length,
        limit: '1mb',
        encoding: ctx.charse
      })

      console.log("ctx.req返回的信息", ctx.req)
      console.log("微信返回的信息", data)
      var content = await util.parseXMLAsync(data) // 对xml格式进行解析
      var message = util.formatMessage(content.xml)
      console.log("结果", message)

      ctx.weixin = message

      await handler.call(ctx, next)
      wechat.reply.call(ctx)
      // console.log("ctx", ctx)
      // var now = new Date().getTime()
      // if (message.MsgType === 'event') {
      //   if (message.Event === 'subscribe') {
      //     ctx.status = 200
      //     ctx.type = "application/xml"
      //     ctx.body = `<xml> 
      //                 <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName> 
      //                 <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName> 
      //                 <CreateTime>${new Date().getTime()}</CreateTime> 
      //                 <MsgType><![CDATA[text]]></MsgType> 
      //                 <Content><![CDATA[你大哥是刘巧，他想问你是不是个大傻逼，大猪蹄子，啊哈哈哈！！你想问点啥？？？随便问！]]></Content> 
      //                 </xml>`
      //     console.log("改变结果之后", ctx)
      //     return ctx.body
      //   }
      // }

      // ctx.status = 200
      // ctx.type = "application/xml"
      // ctx.body = `<xml> 
      //                 <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName> 
      //                 <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName> 
      //                 <CreateTime>${new Date().getTime()}</CreateTime> 
      //                 <MsgType><![CDATA[text]]></MsgType> 
      //                 <Content><![CDATA[我是刘巧大傻逼，喵喵说我是大猪蹄子，但是我超爱喵喵的，喵喵我爱你（づ￣3￣）づ╭～]]></Content> 
      //                 </xml>`
      // console.log("改变结果之后", ctx)
      // return ctx.body


    }

    // await next();
  }
}