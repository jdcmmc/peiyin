/**
 * Created by hhu on 2015/12/24.
 */

var express = require("express");
var http = require('http');
var app = express();

//设置跨域访问
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' Harry')
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

var bodyParser = require('body-parser');
//通常 POST 内容的格式是 application/x-www-form-urlencoded, 因此要用下面的方式来使用
var urlencodedParser = bodyParser.urlencoded({ extended: false })


global.mongoose = require('mongoose');
require('express-mongoose')
global.mongoose.connect('mongodb://182.92.230.67:27017/chang');

//var db = global.mongoose.connect;
//db.on('error', console.error.bind(console, '数据库连接失败:'));
//db.once('open', function() {
//  console.log("数据库连接成功");
//});


var Video = require('./control/video');
var Config = require('./control/config');
var Comment = require('./control/comment');
var User = require('./control/user');
var Interest = require('./control/interest');
//var Vote = require('./control/vote');
var Tag = require('./control/tag');
var Notification = require('./control/notification');


var router = express.Router();
// REST API
router.route('/videos/:type')
  .get(Video.getAll);
router.route('/videos/tag/:type/:tag')
  .get(Video.getByTypeTag);
router.route('/videos/author/:uid')
  .get(Video.getAuthorVideos);
router.route('/videos/voted/:uid')
  .get(Video.getAuthorVotedVideos);
router.route('/videos/parent/:vid/:sort')
  .get(Video.getBrotherVideos);
router.route('/video')
  .post(urlencodedParser, Video.Add)
  .put(urlencodedParser, Video.Update);
router.route('/video/:vid')
  .get(Video.getOne)
  .delete(Video.Delete);
router.route('/video/delete/:vid') //manual
  .get(Video.Delete);
//router.route('/video/update/:vid')
//  .get(Video.Update);
router.route('/video/addcomment/:vid/:cid')
  .get(Video.AddComment);
router.route('/vote/:vid/:uid')
  .get(Video.Vote);
router.route('/devote/:vid/:uid')
  .get(Video.Devote);

router.route('/config')
  .get(Config.GetAll);
router.route('/config/:name')
  .get(Config.Get);
router.route('/config/add/:name/:value')
  .get(Config.Add);
router.route('/config/update/:name/:value')
  .get(Config.Update);
router.route('/download/:file')
  .get(Config.DownloadFile);


router.route('/user')
  .get(User.GetAll)
  .post(urlencodedParser,User.Add)
  .put(urlencodedParser, User.Update);
router.route('/user/:cell')
  .get(User.Get);
router.route('/usericon/:cell')
  .get(User.UpdateIcon); // icon 的文件文件名就是手机号
router.route('/userid/:uid')
  .get(User.GetById);
router.route('/user/add/:name/:password/:icon')
  .get(User.Add);

router.route('/comment')
  .get(Comment.GetAll)
  .post(urlencodedParser, Comment.Add);
router.route('/comment/:vid')
  .get(Comment.Get);
router.route('/mycomment/:uid')
  .get(Comment.getMyComments);


router.route('/interest')
  .get(Interest.GetAll)
  .post(urlencodedParser, Interest.Add);
router.route('/interest/:uid')
  .get(Interest.Get)
  .delete(Interest.Delete);
router.route('/fans/:uid')
  .get(Interest.GetFans)
router.route('/interest/delete')
  .post(urlencodedParser, Interest.DeleteInterests);
router.route('/interest/:uid/:authorid')
  .get(Interest.CheckIfFocus);
router.route('/interest/add/:uid/:iid')
  .get(Interest.QueryAdd);

router.route('/tag')
  .get(Tag.GetAll)
  .post(urlencodedParser, Tag.Add);
router.route('/tag/:cat')
  .get(Tag.Get);
router.route('/tag/add/:cat/:tag/:order')
  .get(Tag.AddFake);

router.route('/noti')
  .get(Notification.Get)
  .post(urlencodedParser, Notification.Add);
router.route('/noti/:uid')
  .get(Notification.GetByUid)
router.route('/noti/add/:title/:text/:to')
  .get(Notification.AddFake);



app.use('/', router);

var server = http.createServer(app).listen(33445, function(){
  console.log("DB服务器开启. 监听端口: 33445...")
});

//var server = http.createServer(app);
//server.on('listening',function(){
//  console.log("DB服务器开启. 监听端口: 33445...")
//});
//
//server.listen(33445);
