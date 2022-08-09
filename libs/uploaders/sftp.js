var fs = require('fs');
const Whoosh = require('whoosh');
module.exports = function(s,config,lang){
    //SFTP
    const storageType = 'sftp'
    function createSftpClient(user){
        return new Promise((resolve) => {
            const connectionDetails = {
                host: userDetails.sftp_host,
                port: parseInt(userDetails.sftp_port) || 22,
            }
            if(userDetails.sftp_username && userDetails.sftp_username !== '')connectionDetails.username = userDetails.sftp_username
            if(userDetails.sftp_password && userDetails.sftp_password !== '')connectionDetails.password = userDetails.sftp_password
            if(userDetails.sftp_privateKey && userDetails.sftp_privateKey !== '')connectionDetails.privateKey = userDetails.sftp_privateKey
            Whoosh.connect(connectionDetails,(err, client) => {
                if(error)sftpErr(user.ke,error);
                resolve({
                    error,
                    sftp: client,
                })
            });
        })
    }
    var sftpErr = function(groupKey,err){
        s.userLog({mid:'$USER',ke:groupKey},{type:lang['SFTP Error'],msg:err.data || err})
    }
    var beforeAccountSaveForSftp = function(d){
        //d = save event
        d.formDetails.use_sftp = d.d.use_sftp
    }
    var loadSftpForUser = function(e){
        // e = user
        var userDetails = JSON.parse(e.details);
        //SFTP
        if(!s.group[e.ke].sftp &&
            !s.group[e.ke].sftp &&
            userDetails.sftp !== '0' &&
            userDetails.sftp_save === '1' &&
            userDetails.sftp_host &&
            userDetails.sftp_host !== ''&&
            userDetails.sftp_port &&
            userDetails.sftp_port !== ''
          ){
            if(!userDetails.sftp_dir || userDetails.sftp_dir === '/'){
                userDetails.sftp_dir = ''
            }
            if(userDetails.sftp_dir !== ''){
                userDetails.sftp_dir = s.checkCorrectPathEnding(userDetails.sftp_dir)
            }
            const { sftp, error } = await createSftpClient(e);
            if(!error)s.group[e.ke].sftp = sftp;
        }
    }
    var unloadSftpForUser = function(user){
        const sftp = s.group[user.ke].sftp
        if(sftp && sftp.disconnect){
            sftp.disconnect(function(){
                s.group[user.ke].sftp = null
            })
        }
    }
    function uploadVideoToSftp(e,k){
        //e = video object
        //k = temporary values
        if(!k)k={};
        //cloud saver - SFTP
        if(s.group[e.ke].sftp && s.group[e.ke].init.use_sftp !== '0' && s.group[e.ke].init.sftp_save === '1'){
            var localPath = k.dir + k.filename
            var saveLocation = s.group[e.ke].init.sftp_dir + e.ke + '/' + e.mid + '/' + k.filename
            s.group[e.ke].sftp.fastPut(saveLocation, saveLocation,(err) => {
                if(err)sftpErr(e.ke,err)
            })
        }
    }
    var createSftpDirectory = function(monitorConfig){
        var monitorSaveDirectory = s.group[monitorConfig.ke].init.sftp_dir + monitorConfig.ke + '/' + monitorConfig.mid
        s.group[monitorConfig.ke].sftp.mkdir(monitorSaveDirectory, true).catch(function(err){
            if(err.code !== 'ERR_ASSERTION'){
                sftpErr(monitorConfig.ke,err)
            }
        })
    }
    var onMonitorSaveForSftp = function(monitorConfig){
        if(s.group[monitorConfig.ke].sftp && s.group[monitorConfig.ke].init.use_sftp !== '0' && s.group[monitorConfig.ke].init.sftp_save === '1'){
            createSftpDirectory(monitorConfig)
        }
    }
    function cloudDiskUseStartup(group,userDetails){
        const diskUseObject = group.cloudDiskUse[storageType]
        diskUseObject.name = 'SFTP'
        diskUseObject.sizeLimitCheck = (userDetails.use_sftp_size_limit === '1')
        if(!userDetails.sftp_size_limit || userDetails.sftp_size_limit === ''){
            diskUseObject.sizeLimit = 10000
        }else{
            diskUseObject.sizeLimit = parseFloat(userDetails.sftp_size_limit)
        }
    }
    var onAccountSaveForSftp = function(group,userDetails,user){
        if(s.group[user.ke] && s.group[user.ke].sftp && s.group[user.ke].init.use_sftp !== '0' && s.group[user.ke].init.sftp_save === '1'){
            Object.keys(s.group[user.ke].rawMonitorConfigurations).forEach(function(monitorId){
                createSftpDirectory(s.group[user.ke].rawMonitorConfigurations[monitorId])
            })
        }
        cloudDiskUseStartup(group,userDetails)
    }
    function deleteFile(user,video,callback){
        // e = user
        const sftp = s.group[user.ke].sftp
        try{
            var videoDetails = JSON.parse(video.details)
        }catch(err){
            var videoDetails = video.details
        }
        if(videoDetails.type !== storageType){
            return
        }
        if(!videoDetails.location){
            videoDetails.location = video.href.split('.amazonaws.com')[1]
        }
        sftp.unlink(videoDetails.location,function(err){
            if (err) console.log(err);
            callback()
        })
    }
    function onInsertTimelapseFrame(monitorObject,queryInfo,filePath){
        const e = monitorObject
        const sftp = s.group[monitorObject.ke].sftp
        if(sftp && s.group[e.ke].init.use_sftp !== '0' && s.group[e.ke].init.sftp_save === '1'){
            var fileStream = fs.createReadStream(filePath)
            fileStream.on('error', function (err) {
                console.error(err)
            })
            var saveLocation = s.group[e.ke].init.sftp_dir + e.ke + '/' + e.mid + '_timelapse/' + queryInfo.filename
            s.group[e.ke].sftp.fastPut(filePath, saveLocation,(err) => {
                if(err)sftpErr(e.ke,err)
                if(err){
                    sftpErr(e.ke,err)
                }
                if(s.group[e.ke].init.sftp_log === '1'){
                    s.knexQuery({
                        action: "insert",
                        table: "Cloud Timelapse Frames",
                        insert: {
                            mid: queryInfo.mid,
                            ke: queryInfo.ke,
                            time: queryInfo.time,
                            filename: queryInfo.filename,
                            details: s.s({
                                type : storageType,
                                location : saveLocation
                            }),
                            size: queryInfo.size,
                            href: ''
                        }
                    })
                    s.setCloudDiskUsedForGroup(e.ke,{
                        amount : s.kilobyteToMegabyte(queryInfo.size),
                        storageType : storageType
                    },'timelapseFrames')
                    s.purgeCloudDiskForGroup(e,storageType,'timelapseFrames')
                }
            })
        }
    }
    await function onGetVideoData(video){
        const sftp = s.group[video.ke].sftp
        const videoDetails = s.parseJSON(video.details)
        const saveLocation = videoDetails.location
        const fileStream = sftp.createReadStream(saveLocation)
        return fileStream
    }
    //SFTP (Simple Uploader)
    s.addCloudUploader({
        name: 'sftp',
        loadGroupAppExtender: loadSftpForUser,
        unloadGroupAppExtender: unloadSftpForUser,
        insertCompletedVideoExtender: uploadVideoToSftp,
        deleteVideoFromCloudExtensions: deleteFile,
        cloudDiskUseStartupExtensions: cloudDiskUseStartup,
        beforeAccountSave: beforeAccountSaveForSftp,
        onAccountSave: onAccountSaveForSftp,
        onMonitorSave: onMonitorSaveForSftp,
        onInsertTimelapseFrame: onInsertTimelapseFrame,
        onDeleteTimelapseFrameFromCloud: deleteFile,
        onGetVideoData
    })
    return {
       "evaluation": "details.use_sftp !== '0'",
       "name": lang['SFTP (SSH File Transfer)'],
       "color": "forestgreen",
       "info": [
           {
              "name": "detail=sftp_save",
              "selector":"autosave_sftp",
              "field": lang.Autosave,
              "default": lang.No,
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
              "field": lang.Host,
              "name": "detail=sftp_host",
              "form-group-class": "autosave_sftp_input autosave_sftp_1",
           },
           {
               "hidden": true,
              "field": lang.Port,
              "name": "detail=sftp_port",
              "form-group-class": "autosave_sftp_input autosave_sftp_1",
          },
           {
               "hidden": true,
              "field": lang.Username,
              "name": "detail=sftp_username",
              "form-group-class": "autosave_sftp_input autosave_sftp_1",
          },
           {
               "hidden": true,
              "field": lang.Password,
              "fieldType": "password",
              "name": "detail=sftp_password",
              "form-group-class": "autosave_sftp_input autosave_sftp_1",
          },
           {
               "hidden": true,
              "field": lang.privateKey,
              "fieldType": "textarea",
              "name": "detail=sftp_privateKey",
              "form-group-class": "autosave_sftp_input autosave_sftp_1",
          },
          {
              "hidden": true,
             "name": "detail=sftp_dir",
             "field": lang['Save Directory'],
             "form-group-class":"autosave_sftp_input autosave_sftp_1",
             "default": "/",
          },
          {
              "hidden": true,
             "name": "detail=sftp_log",
             "field": lang['Save Links to Database'],
             "fieldType": "select",
             "selector": "h_sftpsld",
             "form-group-class":"autosave_sftp_input autosave_sftp_1",
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
            "name": "detail=use_sftp_size_limit",
            "field": lang['Use Max Storage Amount'],
            "fieldType": "select",
            "selector": "h_s3zl",
            "form-group-class":"autosave_sftp_input autosave_sftp_1",
            "form-group-class-pre-layer":"h_sftpsld_input h_sftpsld_1",
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
            "name": "detail=sftp_size_limit",
            "field": lang['Max Storage Amount'],
            "form-group-class":"autosave_sftp_input autosave_sftp_1",
            "form-group-class-pre-layer":"h_sftpsld_input h_sftpsld_1",
            "default": "10000",
         },
       ]
    }
}
