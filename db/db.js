
const MongoClient = require('mongodb').MongoClient // 数据库
const assert = require('assert') // assert模块是Node的内置模块，主要用于断言
const http = require('http')


// const findDocuments = function(db, callback) {
// 	// Get the documents collection
// 	const collection = db.collection('user');
// 	// Find some documents
// 	collection.find({}).toArray(function(err, docs) {
// 		assert.equal(err, null);
// 		console.log("Found the following records");
// 		// console.log(docs)
// 		callback(docs);
// 	});
// }

// var getDate = function() {
// 	return new Promise(function(resolve, reject){
// 		MongoClient.connect(url, {useNewUrlParser: true}, function(err, client) {
// 			assert.equal(null, err);
// 			console.log("------------Connected successfully----------");
// 			const db = client.db(dbName);
// 			findDocuments(db, function(data) {
// 				resolve(data)
// 				console.log("------------closed successfully----------");
// 				client.close();
// 			})
// 		});
// 	})
// }

class DBclient {

	constructor() {
		this.url = 'mongodb://localhost:27017'
		this.dbName = 'wechatDB'
		this.client = ''
		this.db = ''
		this.init()
	}

	async init() {
		this.db = await this.connect()
	}

	connect() {
		return new Promise((resolve, reject) => {
			MongoClient.connect(this.url, {useNewUrlParser: true}, (err, client) => {
				// assert.equal(null, '抛出一个错误' + err);
				if(err) console.log('err============', err)
				console.log("------------Connected successfully----------");
				this.client = client
				const db = client.db(this.dbName);
				resolve(db)
			});
		})
	}

	findAll() {
		const collection = this.db.collection('user');
		return new Promise((resolve, reject) => {
			collection.find({}).toArray((err, docs) => {
				assert.equal(err, null);
				resolve(docs)
				// this.client.close()
			});
		})
	}

	findOne() {
		const collection = this.db.collection('user');
		return new Promise((resolve, reject) => {
			collection.find({"name":"刘巧"}).toArray((err, docs) => {
				assert.equal(err, null);
				resolve(docs)
				// this.client.close()
			});
		})
	}
}


module.exports = new DBclient()