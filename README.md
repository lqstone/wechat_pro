1. 接入微信
signature   微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
timestamp	时间戳
nonce	    随机数
echostr	    随机字符串

2. 获取access_token
特性：一：每两个小时失效7200s， 2更新了则上一个没法用

系统每两个小时刷一次
保存token到本地或者数据库

获取每天上限2000次


3. 获取微信返回的xml

五个步骤： 
1： 处理post逻辑，接收xml数据包
2：解析这个数据包（消息类型和事件类型）
3：拼装我们定义好的消息
4：包装成xml格式
5: 5s内返回





#### npm包支持

> raw-body 拼装http中的request对象，最终拿到一个buffer的xml数据