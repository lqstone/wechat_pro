
var wechat = require('../wechat/g.js')
var reply = require('../wx/reply.js')
var wx = require('../wx/index.js')


exports.hear = async (ctx, next) => {
	console.log(1111111111, ctx)
	ctx.middle = wechat(reply.reply)
	await ctx.middle(ctx, next)
}