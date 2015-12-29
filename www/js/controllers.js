var SITE_API_URL = "http://182.92.230.67:33445";

angular.module('starter.controllers', ['ngCordova','ngSanitize'])

  .controller('HomeCtrl', function($scope,$rootScope,$http,$cordovaToast,$ionicHistory) {
    $scope.title = '<img src="img/logo.png" alt="首页" height="40px" />'

    $scope.getVideos = function() {


      $http.get(SITE_API_URL + '/video').then(function(response){

        if (response.data.return == 'empty'){
          $scope.videos = [];
          $cordovaToast.showShortCenter('没有视频');
          return;
        }

        $scope.videos = response.data;

        if ($scope.videos && $scope.videos.length > 0){
          $scope.videos = response.data;

          $scope.video = $scope.videos[0];
          if (!$rootScope.count) $rootScope.count = 0;
          $rootScope.count++;
          $scope.videoid = $rootScope.count;
        }
      });
    };

    $scope.getVideos();

    $scope.$on('ngRenderFinished', function (ngRenderFinishedEvent) {
      // render完成后执行的js
      $scope.player = videojs("main_video"+ $scope.videoid);
      $scope.player.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/assets/' +  $scope.video.url +'.mp4'});
      //$scope.player.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/assets/' +  $scope.video.url +'.mp4'});
    });
    $scope.$on('$ionicView.unloaded', function () {
      // render完成后执行的js
      $scope.player.destroy();
      $ionicHistory.clearCache();
    });

    $scope.videoHeight = function(){
      var winWidth = 0;
      if (window.innerWidth)
        winWidth = window.innerWidth;
      else if ((document.body) && (document.body.clientWidth))
        winWidth = document.body.clientWidth;
      if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth)
      {
        winWidth = document.documentElement.clientWidth;
      }
      return winWidth * 9 / 16;
    }

    $scope.doRefresh = function(){
      this.getVideos();

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }

  })

  .controller('CatsCtrl', function($scope, $http,$q, Videos) {

    Videos.all().then(function(data){
      $scope.videos = data;
    });
    $scope.remove = function(video) {
      Videos.remove(video);
    };
  })

  .controller('VideoCtrl', function($scope, $stateParams, Videos, $cordovaToast,$state) {
    $scope.videoid = $stateParams.vid;

    $scope.loadVideoByid = function (id) {

      Videos.get(id).then(function (data) {
        $scope.myvideo = data[0];

        $scope.myplayer.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/assets/' +  $scope.myvideo.url +'.mp4'});
        //$scope.myplayer.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/server/output/' +  $scope.myvideo.url +'.mp4'});
        $scope.myplayer.play();
      });

      Videos.getCommentsByVid(id).then(function (data) {
        $scope.comments = data;
      });

      $scope.$apply();
    }

    $scope.loadVideoByid($scope.videoid);


    $scope.$on('ngRenderFinished', function (scope, element, attrs) {
      // render完成后执行的js
      $scope.myplayer = videojs( $scope.videoid);

      $scope.loadVideoByid( $scope.videoid);

    });

    $scope.playIt = function(){
      $scope.myplayer.play();
    }


    $scope.sendMyComment = function(){
      if ($scope.$root.myComment == '' || !$scope.$root.myComment){
        $cordovaToast.showShortCenter('评论内容不能为空');
        return;
      }

      // 评论前要求先登录
      if (window.localStorage['authorized'] != 'yes'){
        $state.go('signin');
        return;
      }

      var comment ={
        video: $scope.videoid,
        author: '568104f9d91f31f76ea027bb', // for test, add it later
        comment: $scope.$root.myComment
        };

      Videos.addComment(comment).then(function(data){
      });

      //????
      // 更新 comments
      Videos.getCommentsByVid($scope.videoid).then(function (data) {
        $scope.comments = data;
        $scope.$apply();
      });

      $scope.$root.myComment = '';
    }

  })

  .controller('PlayerCtrl', function($scope, $stateParams) {
    $scope.videoid = $stateParams.vid;

    $scope.$on('ngRenderFinished', function (scope, element, attrs) {
      // render完成后执行的js
      $scope.myplayer = videojs( $scope.videoid);
      $scope.myplayer.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/server/output/' +  $scope.videoid +'.mp4'});
      $scope.myplayer.play();
    });

    $scope.playIt = function(){
      $scope.play();
    }

    $scope.doRefresh = function(){
      $scope.myplayer = videojs( $scope.videoid);
      $scope.myplayer.src({type: 'video/mp4', src: 'http://101.200.81.99:8080/ciwen/server/output/' +  $scope.videoid +'.mp4'});
      $scope.myplayer.play();
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    }

  })

  //
  .controller('CatDetailCtrl', function($scope,$sce, $rootScope,$stateParams, Videos,$cordovaMedia, $cordovaFile,$cordovaFileTransfer,$ionicLoading,$http,$state) {

    // 录音前要求先登录
    if (window.localStorage['authorized'] != 'yes'){
      $state.go('signin');
      return;
    }


    Videos.all().then(function(data){
      $scope.videos = data;
      $scope.$apply();
    });

    var UPLOAD_URL = 'http://101.200.81.99:8888'
    $scope.step = 0;
    $scope.pauseCount = 0;
    $scope.totalCount = 0;
    $scope.info = [];
    $scope.preview_flag = false;
    $scope.preview_inprocess = false;
    $scope.currentRecord = false;
    $scope.$root.showUploadButton = false;

    $scope.mode = '';
    if (!$rootScope.count) $rootScope.count = 0;
    $rootScope.count++;
    $scope.videoid = $rootScope.count;


    //音量改变时
    //my_player.on("volumechange", function(){
    //  $scope.volume = my_player.volume();//获取当前音量
    //});
    //$scope.output_video = '9pigu4mbfi6auhhn'; // for test

    $scope.prepareAudiofile = function(){

      $cordovaFile.checkFile($rootScope.rootDir, $scope.myRecord)
        .then(function (success) {
          // success
        }, function (error) {
          // error
          $cordovaFile.createFile($rootScope.rootDir, $scope.myRecord, true)
            .then(function (success) {
              // success
              //alert('创建文件成功');
            }, function (error) {
              // error
              alert('创建文件失败');
            });
        });
    };

    $scope.prepare = function(pause_count,time){
      //$scope.currentTime = 0;
      //$scope.volume = my_player.volume();

      $scope.myRecord = $scope.file_no_ext + pause_count + '.mp3';
      $scope.prepareAudiofile();

      $scope.mediaRec = new Media($rootScope.rootDir + $scope.myRecord,
        // success callback
        function() {
          if ($scope.mode == 'record'){ //录完
            //alert("录音完成");
            $scope.recordStatus = 5;
          }
          else if ($scope.mode == 'preview'){ //播完
            //alert("录音播放完成");
            $scope.recordStatus = 6;
            //if ($scope.my_player)
            //  $scope.my_player.pause();
          }
        },
        // error callback
        function(err) {
          alert("录音失败: "+ err.code);
          $scope.recordStatus = -1;
          $scope.$apply();
        }
        ,function(status){
        }
      );

      if (!$scope.preview_flag){
        var _info = {
          count: pause_count,
          start_time: time,
          name: $scope.myRecord
        };
        $scope.info.push(_info);
      }

    }

    // 支持preview播放
    $scope.previewRecord = function() {
      $scope.mode = 'preview';
      $scope.my_player.currentTime(0);
      $scope.my_player.play();

      // 放到“timeupdate”事件触发时播放
      $scope.preview_flag = true;
      $scope.preview_inprocess = false;
      //$scope.totalCount = $scope.pauseCount;
      $scope.pauseCount = 0; //不能再录了

      $scope.currentRecord = false;
      $scope.recordStatus = 7;

      // 可以review&upload
      $scope.step = 2;
      $scope.$root.showUploadButton = true;

      $scope.$apply();
    }

    $scope.stopRecording = function(){
      $scope.recordStatus = 4;

      $scope.my_player.pause();
      $scope.my_player.currentTime(0);
      $scope.mediaRec.stopRecord();
      $scope.mediaRec.release();
      //$scope.mediaRec.seekTo(0);

      $scope.currentRecord = false;
      $scope.pauseCount++;
      $scope.totalCount = $scope.pauseCount;
      $scope.step = 2; // 可以review&upload
    }

    //Media 不支持在录制过程中暂停，所以暂停其实是停止录制. 继续录制其实是开始录制
    $scope.captureAudio = function() {
      $scope.mode = 'record';

      if (!$scope.currentRecord){

        // 录制第一个录音，清空先
        if ($scope.pauseCount == 0){
          $scope.info = []; //
        }

        $scope.prepare($scope.pauseCount, $scope.my_player.currentTime());

        //$scope.my_player.currentTime(0);
        $scope.my_player.play();

        // Record audio
        $scope.mediaRec.startRecord();
        $scope.recordStatus = 1;

      }
      else{
        $scope.my_player.pause();
        $scope.mediaRec.stopRecord();
        $scope.mediaRec.release();
        $scope.mode = '';
        $scope.recordStatus = 3; // 暂停
        $scope.pauseCount++;
        $scope.totalCount = $scope.pauseCount;
        $scope.step = 1; // 可以review&upload?
      }
      $scope.currentRecord = !$scope.currentRecord;
    }

    $scope.getStatus = function(id){

      switch (id){
        case -1:
          return '录音失败';
        case 0:
          return '等待视频加载...';
        case 1:
          return '开始';
        case 2:
          return '运行';
        case 3:
          return '暂停';
        case 4:
          return '停止';
        case 5:
          return '录音完成';
        case 6:
          return '录音播放完成';
        case 7:
          return '开始播放';
        case 8:
          return '视频加载完成';
        case 9:
          return '视频加载出错';
        case 10:
          return '上传完成';
        default :
          return '';
      }
    }

    $scope.loadVideoByid = function(id){

      //alert(id)
      Videos.get(id).then(function(data){
        $scope.myvideo = data[0];
        //alert(JSON.stringify($scope.myvideo))

        $scope.file_no_ext = $scope.myvideo.url;
        //alert($scope.myvideo.url)
        $scope.my_player.src({type: "video/mp4", src:'http://101.200.81.99:8080/ciwen/assets/' + $scope.myvideo.url + '.mp4'});
        $scope.my_player.load();

        //alert( $scope.myvideo.name)

        // clear the environment
        $scope.recordStatus = '';
        $scope.currentTime = '';
        $scope.duration = '';
        $scope.step = 0;
        $scope.$root.showUploadButton = false;

        $scope.$apply();
      });
    }

    var tmp_count=0;
    $scope.$on('ngRenderFinished', function (scope, element, attrs) {
      // render完成后执行的js
      $scope.my_player = videojs('my_video' + $scope.videoid);

      $scope.loadVideoByid($stateParams.catId);

      //$scope.my_player.muted('true' == window.localStorage.getItem('muted'));
      $ionicLoading.show({
        template: '<i onclick="hideLoading()">视频加载中...</i>',
        noBackdrop:true
      });
      var hideLoading = function(){
        $ionicLoading.hide();
      }

      $scope.my_player.on("loadeddata", function(a){
        if ($scope.duration < 1) return;

        // 暂停，但下载还在继续
        $scope.my_player.muted(false);
        $scope.my_player.play()
        //$scope.my_player.pause()

        // 启动定时器检测视频下载进度
        var timer = setInterval(function() {
          // 获取视频已经下载的时长
          var buffered = 0;
          try {
            buffered = $scope.my_player.bufferedEnd() || 0;
            buffered = parseInt(buffered);
          }
          catch(e) {
            alert(JSON.stringify(e))
          }

          if(buffered < $scope.duration) {
            $scope.bufferedTime = buffered;
            $scope.$apply();
            return
          }

          // 全部下载，all buffered
          $scope.step = 1; //可以开始了
          $scope.recordStatus = 8; //loaded!
          $ionicLoading.hide();
          $scope.my_player.pause()
          $scope.my_player.currentTime(0)
          $scope.$apply();

          $scope.my_player.muted('true' == window.localStorage.getItem('muted')); // 录制时要不要原声

          clearInterval(timer)
        }, 1000)
      });

      $scope.my_player.on("error", function(a) {
        $scope.recordStatus = 9; //loaded error!
        $ionicLoading.hide();
        $scope.$apply();
      });

      $scope.my_player.on("loadedmetadata", function(a){
        $scope.duration = parseInt($scope.my_player.duration());//获取总时长
        $scope.my_player.play();

        $scope.recordStatus = 0;
        $scope.currentRecord = false;
      });

      $scope.my_player.on("timeupdate", function(a){
        var current_time = $scope.my_player.currentTime();//获取当前播放时间

        // 在这里播放录音 preview，因为时间跟视频同步，比较准确
        // 步骤:
        //    1. 获取当前视频播放时间；
        //    2. 查表获取与之对应的录音（文件名，开始时间）；
        //    3. 关掉前面的录音，开始播放新的
        if ($scope.preview_flag && !$scope.preview_inprocess){
          for(var i=$scope.info.length-1; i >= 0 ; i--){
            if ($scope.info[i].start_time <= current_time){ // 如果current_time到达或过了 start_time，则开始播放
              $scope.start_time = $scope.info[i].start_time;
              $scope.current_time = current_time
              $scope.info_pause_count = $scope.info[i].count;

              $scope.pauseCount = $scope.info[i].count;
              $scope.preview_inprocess = true;


              // 获取录音文件和开始播放时间
              $scope.mediaRec = new Media($rootScope.rootDir + $scope.info[i].name, null, null, $scope.mediaStatusCallback);
              //$scope.prepare($scope.pauseCount, $scope.info[i].start_time);

              $scope.mediaRec.seekTo((current_time - $scope.info[i].start_time) * 1000);
              $scope.mediaRec.play();

              //$scope.$apply(); // for test
              return;
            }
          }
        }

        // 以下是更新信息
        $scope.currentTime = parseInt(current_time);
        if (tmp_count !=  $scope.currentTime)
          $scope.$apply();
        tmp_count = $scope.currentTime;

      });

      $scope.mediaStatusCallback = function(status){
        if (status == 0 || status == 4 ){//Media.MEDIA_NONE = 0; Media.MEDIA_STOPPED = 4;
          $scope.preview_inprocess = false; //播放完的话就把flag设置回来
          $scope.$apply();
        }
      }

      $scope.my_player.on("ended", function(a){
        if ($scope.currentRecord){
          $scope.stopRecording();
        }
        $scope.preview_flag = false;
        $scope.pauseCount = 0; //不能再录了
        $scope.preview_inprocess = false;

        $scope.$apply();// for test

      });
    });

    $scope.$on('$ionicView.unloaded', function () {
      // render完成后执行的js
      $scope.my_player.destroy();

    });

    $scope.uploaded_count = 0;
    $scope.upload = function(file_name) {

      var options = {
        fileName: file_name,
        chunkedMode: false,
        mimeType: "audio/mpeg",
        httpMethod: "post"
      };

      //$cordovaFileTransfer.upload( "http://182.92.230.67:8888/upload",$rootScope.rootDir + options.fileName, options, true)
      $cordovaFileTransfer.upload( "http://101.200.81.99:8888/upload",$rootScope.rootDir + options.fileName, options, true)
        .then(function(result) {
          $ionicLoading.hide();

          $scope.uploaded_count++; // 成功的上传个数

          // 判断一下，如果全部传完，给服务器发个消息，要求进行音频的组合以及同视频的合成
          if ($scope.uploaded_count == $scope.totalCount){
            $scope.uploaded();
            $scope.getStatus = 10;
            $scope.$apply();
          }
        }, function(err) {
          $ionicLoading.hide(); // hide it in case
          alert("ERROR: " + JSON.stringify(err));
        }, function (progress) {
          // constant progress updates
          if (progress.lengthComputable) {
            if (progress.loaded == progress.total){
              $ionicLoading.hide();
            }
            else {
              $ionicLoading.show({
                template: (progress.loaded / progress.total).toFixed(2) * 100 + '%上传'
              });
            }

          } else {
            $ionicLoading.show({
              template: '上传中...'
            });
          }
        });
    }

    $scope.$root.uploads = function() {

      $scope.uploaded_count = 0;
      for (var i=0; i< $scope.info.length; i++){
        $scope.upload($scope.info[i].name);
      }

      $scope.step = 3; // 可以分享

    }

    Object.toParams = function ObjecttoParams(obj) {
      var p = [];
      for (var key in obj) {
        p.push(key + '=' + encodeURIComponent(obj[key]));
      }
      return p.join('&');
    };


    $scope.uploaded = function(){
      //alert('uploaded: '+$scope.totalCount)
      $http.post('http://101.200.81.99:8888/uploaded',Object.toParams({name:$scope.file_no_ext, count: $scope.totalCount}), {
          dataType: 'json',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        .success(function(data, status, headers, config){
          if (!data || data.return == 'error'){
            alert('转码失败!');
            return;
          }

          //
          //$scope.output_video = UPLOAD_URL + '/player/' + data.return;
          $scope.output_video = data.return;
          $scope.$apply();
          //alert($scope.output_video)
        })
        .error(function(data,status, headers, config){
          console.log('uploaded ('+$scope.file_no_ext+') error');
        });
    }
  })

  //============================================================================================================

  // 用户账号管理
  .controller('AccountCtrl', function($scope,$state,$rootScope,$http,$cordovaToast) {

    // 如果没有登录，去登录
    if (!localStorage['authorized'] || localStorage['authorized'] != 'yes'){
      $state.go('signin');
      return;
    }

    $scope.cell = '';
    if (!localStorage['cell'])
      $scope.user_name = '我未登录';
    else{
      $scope.user_name = localStorage['name'];
      $scope.cell == '(' + localStorage['cell'] + ')';
    }

    $scope.logout = function(){
      localStorage['cell'] = '';
      localStorage['name'] = '';
      localStorage['authorized'] = '';
      $rootScope.previousState = '';
      $state.go('tab.home');
    }

    // MUTED related!
    if (window.localStorage.getItem('muted') ==  null){
      $scope.muted = true; //default
      window.localStorage.setItem('muted',true);
    }

    $scope.muted = ('true' == window.localStorage.getItem('muted'));

    $scope.updateMuted = function(){
      $scope.muted = !$scope.muted;
      window.localStorage.setItem('muted',$scope.muted);
    }
  })

  //--------------------------------------------------------------------------------------------------------------
  .directive('onFinishRender', function () {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        if (scope.$last) setTimeout(function(){
          scope.$emit('ngRenderFinished', element, attrs);
        }, 1);
      }
    };
  });

