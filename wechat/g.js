/*
  封装链接微信为中间件
 */

var sha1 = require('sha1')
var config = require('../config.js')
var Wechat = require('./wechat.js')
var getRawBody = require('raw-body')
var util = require('./util.js')

//  signature: '692ac6f55cbfacbc9a9faf76dac8fc34ae3bf8cd',
//  echostr: '3420778034199525051',
//  timestamp: '1533712032',
//  nonce: '135059459'


module.exports = () => {
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
        ctx.body = "wrong"
      }
    } else if (ctx.method === 'POST') {
      if (sha !== signature) {
        ctx.body = "wrong"
        return false
      } 

      var data = await getRawBody(ctx.req, {
        length: ctx.length,
        limit: '1mb',
        encoding: ctx.charse
      })

      var content = await util.parseXMLAsync(data)   // 对xml格式进行解析
      console.log("xml", content)
      var message = util.formatMessage(content.xml)
      console.log("结果",message)

      console.log("ctx", ctx)

      // if(message.MsgType === 'event') {
        // if(message.Event === 'subscribe') {
          var now = new Date().getTime()
          ctx.status = 200
          ctx.type = "application/xml"
          ctx.body = `<xml> 
                      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName> 
                      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName> 
                      <CreateTime>${new Date().getTime()}</CreateTime> 
                      <MsgType><![CDATA[text]]></MsgType> 
                      <Content><![CDATA[这儿是JavaScript之禅]]></Content> 
                      </xml>`
          console.log("改变结果之后", ctx)
          return ctx.body
        // }
      // }

      // <xml><ToUserName><![CDATA[gh_f7746fb87a28]]></ToUserName>
      // <FromUserName><![CDATA[ogQVX1KXDhDAUtqETox238GX1jYk]]></FromUserName>
      // <CreateTime>1533785590</CreateTime>
      // <MsgType><![CDATA[event]]></MsgType>
      // <Event><![CDATA[subscribe]]></Event>
      // <EventKey><![CDATA[]]></EventKey>
      // </xml>


    }

    // await next();
  }
}