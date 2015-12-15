/**
 * Created by hhu on 2015/12/3.
 */

var formidable = require('formidable'),
  util = require('util'),
  fs = require('fs'),
  sprintf = require("sprintf-js").sprintf;

module.exports = {

  receiveFile: function(req, res){
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    //form.keepExtensions = true;
    //form.uploadDir = "/home/wwwroot/product.geiliyou.com/ciwen/upload";

    form.parse(req, function(err, fields, files) {

      res.writeHead(200, {'content-type': 'text/plain'});
      //res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));

      //fs.rename 类似于 move
      fs.rename(files.file.path, 'upload/' + files.file.name, function(err) {
        if (err) throw err;
      });
    });
    return;
  },

  uploaded: function(req, res, next){
    if (!req.body) return res.sendStatus(400);

    var name = req.body.name;
    var count = req.body.count;

    // ffmpeg -i upload/myrecording0.mp3 -i upload/myrecording1.mp3  -filter_complex concat=n=3:v=0:a=1 -vn -y upload/input.m4a

    var cmd = '';
    for (var i=0; i<count; i++){
      cmd += '-i upload/' + name + i + '.mp3 ';
    }

    cmd = sprintf('ffmpeg %s -filter_complex concat=n=%s:v=0:a=1 -vn -y upload/%s.m4a', cmd, count, name);

    console.log(cmd);
    require('child_process').exec( cmd , function(err, stdout , stderr ) {
      if (err) {
        console.log( stderr );
        res.send('{"return": "error"}');
        return;
      }

      // 生成随机码
      var token = '';//require('crypto').randomBytes(16);
      var $chars = 'abcdefghijkmnopqrstuvwxyz0123456789';
      var maxPos = $chars.length;
      for (i = 0; i < 16; i++) {
        token += $chars.charAt(Math.floor(Math.random() * maxPos));
      }

      // 音视频合成
      cmd = sprintf('ffmpeg -i ../assets/%s.mp4 -i upload/%s.m4a -c:v copy -codec:a libvo_aacenc -b:a 64k -maxrate 64k -map 0:v:0 -map 1:a:0  -y ../output/%s.mp4', name, name, token);
      //cmd = sprintf('ffmpeg -i ../assets/%s.mp4 -i upload/%s.m4a -c:v copy -c:a aac -strict experimental -map 0:v:0 -map 1:a:0 -y ../output/%s.mp4', name, name, token);
      //cmd = sprintf('ffmpeg -i ../assets/%s.mp4 -i upload/%s.m4a -profile:v high -preset slow -b:v 500k -maxrate 500k -bufsize 1000k -vf scale=-1:480 -threads 0 -codec:a libvo_aacenc -b:a 64k -map 0:v:0 -map 1:a:0 -y ../output/%s.mp4', name, name, token);
      console.log(cmd);
      require('child_process').exec( cmd , function(err, stdout , stderr ) {
        if (err) {
          console.log(stderr);
          res.send('{"return": "error"}');
          return;
        }
      });

      res.send(sprintf('{"return": "%s"}', token));
    });
  },

  showFileUploadForm: function(req, res){
    // show a file upload form
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
      '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );
  }
}
