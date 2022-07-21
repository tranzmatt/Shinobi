var fs = require('fs');
module.exports = function(s,config,lang){
    function beforeAccountSave(d){
        //d = save event
        d.formDetails.dropbox_use_global = d.d.dropbox_use_global
        d.formDetails.use_dropbox = d.d.use_dropbox
    }
    function cloudDiskUseStartup(group,userDetails){
        group.cloudDiskUse['dropbox'].name = 'Dropbox'
        group.cloudDiskUse['dropbox'].sizeLimitCheck = (userDetails.use_dropbox_size_limit === '1')
        if(!userDetails.dropbox_size_limit || userDetails.dropbox_size_limit === ''){
            group.cloudDiskUse['dropbox'].sizeLimit = 10000
        }else{
            group.cloudDiskUse['dropbox'].sizeLimit = parseFloat(userDetails.dropbox_size_limit)
        }
    }
    function loadGroupApp(e){
        // e = user
        var userDetails = JSON.parse(e.details)
        if(userDetails.dropbox_use_global === '1' && config.cloudUploaders && config.cloudUploaders.AmazonS3){
            // {
            //     dropbox_accessKeyId: "",
            //     dropbox_secretAccessKey: "",
            //     dropbox_region: "",
            //     dropbox_bucket: "",
            //     dropbox_dir: "",
            // }
            userDetails = Object.assign(userDetails,config.cloudUploaders.AmazonS3)
        }
        if(
            !s.group[e.ke].dropbox &&
            userDetails.dropbox !== '0' &&
            userDetails.dropbox_token !== ''&&
            userDetails.dropbox_secretAccessKey &&
            userDetails.dropbox_secretAccessKey !== ''&&
            userDetails.dropbox_region &&

            userDetails.dropbox_region !== ''&&
            userDetails.dropbox_bucket !== ''
        ){
            if(!userDetails.dropbox_dir || userDetails.dropbox_dir === '/'){
                userDetails.dropbox_dir = ''
            }
            if(userDetails.dropbox_dir !== ''){
                userDetails.dropbox_dir = s.checkCorrectPathEnding(userDetails.dropbox_dir)
            }
            const dropboxV2Api = require('dropbox-v2-api');
            const userToken = userDetails.dropbox_token
            const dropbox = dropboxV2Api.authenticate({
                token: userToken
            });
            s.group[e.ke].dropbox = dropbox;
        }
    }
    function unloadGroupApp(user){
        s.group[user.ke].dropbox = null
    }
    function uploadVideo(e,k){
        if(s.group[e.ke].dropbox && s.group[e.ke].init.use_dropbox !== '0' && s.group[e.ke].init.dropbox_save === '1'){
            const saveLocation = s.group[e.ke].init.dropbox_dir+e.ke+'/'+e.mid+'/'+k.filename
            const dropbox = s.group[e.ke].dropbox;
            if(!dropbox)return;
            dropbox({
                resource: 'files/upload',
                parameters: {
                    path: saveLocation
                },
                readStream: fs.createReadStream(k.dir+k.filename)
            }, (err, data, response) => {
                if(err){
                    s.userLog(e,{
                        type: lang['Dropbox Upload Error'],
                        msg: err,
                        path: saveLocation
                    })
                }
                if(s.group[e.ke].init.dropbox_log === '1' && data && data.path_display){
                    s.knexQuery({
                        action: "insert",
                        table: "Cloud Videos",
                        insert: {
                            mid: e.mid,
                            ke: e.ke,
                            time: k.startTime,
                            status: 1,
                            details: JSON.stringify({
                                type : 'dropbox',
                                location : saveLocation
                            }),
                            size: k.filesize,
                            end: k.endTime,
                            href: data.path_display
                        }
                    })
                    s.setCloudDiskUsedForGroup(e.ke,{
                        amount: k.filesizeMB,
                        storageType: 'dropbox'
                    })
                    s.purgeCloudDiskForGroup(e,'dropbox')
                }
            })
        }
    }
    function deleteVideo(e,video,callback){
        // e = user
        try{
            var videoDetails = JSON.parse(video.details)
        }catch(err){
            var videoDetails = video.details
        }
        const dropbox = s.group[e.ke].dropbox;
        if(!dropbox)return callback();
        dropbox({
            resource: 'files/delete_v2',
            parameters: {
                path: videoDetails.location
            },
        }, (err, result, response) => {
            if (err) console.log(err);
            callback(err, result);
        });
    }
    function onInsertTimelapseFrame(monitorObject,queryInfo,filePath){
        var e = monitorObject
        if(s.group[e.ke].dropbox && s.group[e.ke].init.use_dropbox !== '0' && s.group[e.ke].init.dropbox_save === '1'){
            var saveLocation = s.group[e.ke].init.dropbox_dir + e.ke + '/' + e.mid + '_timelapse/' + queryInfo.filename
            const dropbox = s.group[e.ke].dropbox;
            dropbox({
                resource: 'files/upload',
                parameters: {
                    path: saveLocation
                },
                readStream: fs.createReadStream(filePath)
            }, (err, data, response) => {
                if(err){
                    s.userLog(e,{
                        type: lang['Dropbox Upload Error'],
                        msg: err,
                        path: saveLocation
                    })
                }
                if(s.group[e.ke].init.dropbox_log === '1' && data && data.path_display){
                    s.knexQuery({
                        action: "insert",
                        table: "Cloud Timelapse Frames",
                        insert: {
                            mid: queryInfo.mid,
                            ke: queryInfo.ke,
                            time: queryInfo.time,
                            details: JSON.stringify({
                                type : 'dropbox',
                                location : saveLocation
                            }),
                            size: queryInfo.size,
                            href: data.path_display
                        }
                    })
                    s.setCloudDiskUsedForGroup(e.ke,{
                        amount : s.kilobyteToMegabyte(queryInfo.size),
                        storageType : 'dropbox'
                    },'timelapseFrames')
                    s.purgeCloudDiskForGroup(e,'dropbox','timelapseFrames')
                }
            })
        }
    }
    function onDeleteTimelapseFrameFromCloud(e,frame,callback){
        // e = user
        try{
            var frameDetails = JSON.parse(frame.details)
        }catch(err){
            var frameDetails = frame.details
        }
        if(frameDetails.type !== 'dropbox'){
            return
        }
        const dropbox = s.group[e.ke].dropbox;
        dropbox({
            resource: 'files/delete_v2',
            parameters: {
                path: frameDetails.location
            },
        }, (err, result, response) => {
            if (err) console.log(err);
            callback(err, result);
        });
    }
    function onGetVideoData(video){
        return new Promise((resolve,reject) => {
            const videoDetails = JSON.parse(r.details)
            const saveLocation = videoDetails.location
            try{
                const downloadStream = dropbox({
                    resource: 'files/download',
                    parameters: {
                        path: saveLocation
                    }
                });
                resolve(downloadStream)
            }catch(err){
                reject(err)
            }
        })
    }
    s.addCloudUploader({
        name: 'dropbox',
        loadGroupAppExtender: loadGroupApp,
        unloadGroupAppExtender: unloadGroupApp,
        insertCompletedVideoExtender: uploadVideo,
        deleteVideoFromCloudExtensions: deleteVideo,
        cloudDiskUseStartupExtensions: cloudDiskUseStartup,
        beforeAccountSave: beforeAccountSave,
        onAccountSave: cloudDiskUseStartup,
        onInsertTimelapseFrame: onInsertTimelapseFrame,
        onDeleteTimelapseFrameFromCloud: onDeleteTimelapseFrameFromCloud,
        onGetVideoData: onGetVideoData
    })
    //return fields that will appear in settings
    return {
       "evaluation": "details.use_dropbox !== '0'",
       "name": lang["Dropbox"],
       "color": "forestgreen",
       "info": [
           {
              "name": "detail=dropbox_save",
              "selector":"autosave_dropbox",
              "field": lang.Autosave,
              "description": "",
              "default": lang.No,
              "example": "",
              "fieldType": "select",
              "possible": [
                  {
                     "name": lang.No,
                     "value": "0"
                  },
                  {
                     "name": lang.Yes,
                     "value": "1"
                  }
              ]
           },
           {
               "hidden": true,
              "field": lang['Token'],
              "name": "detail=dropbox_token",
              "form-group-class": "autosave_dropbox_input autosave_dropbox_1",
              "description": "",
              "default": "",
              "example": "",
              "possible": ""
           },
          {
              "hidden": true,
             "name": "detail=dropbox_log",
             "field": lang['Save Links to Database'],
             "fieldType": "select",
             "selector": "h_dropbox_links",
             "form-group-class":"autosave_dropbox_input autosave_dropbox_1",
             "description": "",
             "default": "",
             "example": "",
             "possible": [
                 {
                    "name": lang.No,
                    "value": "0"
                 },
                 {
                    "name": lang.Yes,
                    "value": "1"
                 }
             ]
         },
         {
             "hidden": true,
            "name": "detail=use_dropbox_size_limit",
            "field": lang['Use Max Storage Amount'],
            "fieldType": "select",
            "selector": "h_s3zl",
            "form-group-class":"autosave_dropbox_input autosave_dropbox_1",
            "form-group-class-pre-layer":"h_dropbox_links_input h_dropbox_links_1",
            "description": "",
            "default": "",
            "example": "",
            "possible":  [
                {
                   "name": lang.No,
                   "value": "0"
                },
                {
                   "name": lang.Yes,
                   "value": "1"
                }
            ]
         },
         {
             "hidden": true,
            "name": "detail=dropbox_size_limit",
            "field": lang['Max Storage Amount'],
            "form-group-class":"autosave_dropbox_input autosave_dropbox_1",
            "form-group-class-pre-layer":"h_dropbox_links_input h_dropbox_links_1",
            "description": "",
            "default": "10000",
            "example": "",
            "possible": ""
         },
         {
             "hidden": true,
            "name": "detail=dropbox_dir",
            "field": lang['Save Directory'],
            "form-group-class":"autosave_dropbox_input autosave_dropbox_1",
            "description": "",
            "default": "/",
            "example": "",
            "possible": ""
         },
       ]
    }
}
