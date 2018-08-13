var Koa=require('koa')
var router = require('koa-router')();  /*引入是实例化路由** 推荐*/
var sha1 = require('sha1')
var wechat = require('./wechat/g.js')
var reply = require('./wx/reply.js')    // 处理微信逻辑
var app = new Koa()

// app.use(async (ctx,next)=>{
//     console.log('1、这是第一个中间件01');
//     await next();

//     console.log('5、匹配路由完成以后又会返回来执行中间件');
// })

// app.use(async (ctx,next)=>{
//     console.log('2、这是第二个中间件02');
//     await next();

//     console.log('4、匹配路由完成以后又会返回来执行中间件');
// })
// 
app.use(wechat(reply.reply))   // 业务逻辑传给weixin.reply来处理
router.get('/',async (ctx)=>{
    ctx.body="首页"
})
router.get('/news',async (ctx)=>{
    console.log('3、匹配到了news这个路由');
    ctx.body='这是一个新闻'
})


app.use(router.routes())  /*启动路由*/
app.use(router.allowedMethods())
app.listen(3000)