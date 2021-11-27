const fs = require('fs');
module.exports = function(s,config,lang,app,io){
    function getIpAddress(req){
        return (req.headers['cf-connecting-ip'] ||
            req.headers["CF-Connecting-IP"] ||
            req.headers["'x-forwarded-for"] ||
            req.connection.remoteAddress).replace('::ffff:','');
    }
    function initiateDataConnection(client,req,options,connectionId){
        const ipAddress = getIpAddress(req) + ':' + options.port
        client.ip = ipAddress;
        client.shinobiChildAlreadyRegistered = true;
        client.sendJson = (data) => {
            client.send(JSON.stringify(data))
        }
        if(!s.childNodes[ipAddress]){
            s.childNodes[ipAddress] = {}
        };
        const activeNode = s.childNodes[ipAddress];
        activeNode.dead = false
        activeNode.cnid = client.id
        activeNode.cpu = 0
        activeNode.ip = ipAddress
        activeNode.activeCameras = {}
        options.availableHWAccels.forEach(function(accel){
            if(config.availableHWAccels.indexOf(accel) === -1)config.availableHWAccels.push(accel)
        })
        client.sendJson({
            f : 'init_success',
            childNodes : s.childNodes,
            connectionId: connectionId,
        })
        activeNode.coreCount = options.coreCount
        console.log('Initiated Child Node : ', ipAddress)
        return ipAddress
    }
    function onWebSocketDataFromChildNode(client,data){
        const activeMonitor = data.ke && data.mid && s.group[data.ke] ? s.group[data.ke].activeMonitors[data.mid] : null;
        const ipAddress = client.ip;
        switch(data.f){
            case'cpu':
                s.childNodes[ipAddress].cpu = data.cpu;
            break;
            case'sql':
                s.sqlQuery(data.query,data.values,function(err,rows){
                    client.sendJson({f:'sqlCallback',rows:rows,err:err,callbackId:data.callbackId});
                });
            break;
            case'knex':
                s.knexQuery(data.options,function(err,rows){
                    client.sendJson({f:'sqlCallback',rows:rows,err:err,callbackId:data.callbackId});
                });
            break;
            case'clearCameraFromActiveList':
                if(s.childNodes[ipAddress])delete(s.childNodes[ipAddress].activeCameras[data.ke + data.id])
            break;
            case'camera':
                s.camera(data.mode,data.data)
            break;
            case's.tx':
                s.tx(data.data,data.to)
            break;
            case's.userLog':
                if(!data.mon || !data.data)return console.log('LOG DROPPED',data.mon,data.data);
                s.userLog(data.mon,data.data)
            break;
        }
    }
    function onDataConnectionDisconnect(client, req){
        const ipAddress = client.ip;
        console.log('childNodeWebsocket.disconnect',ipAddress)
        if(s.childNodes[ipAddress]){
            var monitors = Object.values(s.childNodes[ipAddress].activeCameras)
            if(monitors && monitors[0]){
                var loadCompleted = 0
                var loadMonitor = function(monitor){
                    setTimeout(function(){
                        var mode = monitor.mode + ''
                        var cleanMonitor = s.cleanMonitorObject(monitor)
                        s.camera('stop',Object.assign(cleanMonitor,{}))
                        delete(s.group[monitor.ke].activeMonitors[monitor.mid].childNode)
                        delete(s.group[monitor.ke].activeMonitors[monitor.mid].childNodeId)
                        setTimeout(function(){
                            s.camera(mode,cleanMonitor)
                            ++loadCompleted
                            if(monitors[loadCompleted]){
                                loadMonitor(monitors[loadCompleted])
                            }
                        },1000)
                    },2000)
                }
                loadMonitor(monitors[loadCompleted])
            }
            s.childNodes[ipAddress].activeCameras = {}
            s.childNodes[ipAddress].dead = true
        }
    }
    function initiateFileWriteFromChildNode(client,data,connectionId,onFinish){
        const response = {ok: true}
        const groupKey = data.ke
        const monitorId = data.mid
        const filename = data.filename
        const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
        const writeDirectory = data.writeDirectory
        const fileWritePath = writeDirectory + filename
        const writeStream = fs.createWriteStream(fileWritePath)
        if (!fs.existsSync(writeDirectory)) {
            fs.mkdirSync(writeDirectory, {recursive: true}, (err) => {s.debugLog(err)})
        }
        activeMonitor.childNodeStreamWriters[filename] = writeStream
        client.on('message',(d) => {
            writeStream.write(d)
        })
        client.on('close',(d) => {
            setTimeout(() => {
                // response.fileWritePath = fileWritePath
                // response.writeData = data
                // response.childNodeId = connectionId
                activeMonitor.childNodeStreamWriters[filename].end();
                setTimeout(() => {
                    delete(activeMonitor.childNodeStreamWriters[filename])
                },100)
                onFinish(response)
            },2000)
        })
    }
    function initiateVideoWriteFromChildNode(client,data,connectionId){
        return new Promise((resolve,reject) => {
            const groupKey = data.ke
            const monitorId = data.mid
            const filename = data.filename
            const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
            const monitorConfig = s.group[groupKey].rawMonitorConfigurations[monitorId]
            const videoDirectory = s.getVideoDirectory(monitorConfig)
            data.writeDirectory = videoDirectory
            initiateFileWriteFromChildNode(client,data,connectionId,(response) => {
                setTimeout(() => {
                    //delete video file from child node
                    s.cx({
                        f: 'delete',
                        file: filename,
                        ke: data.ke,
                        mid: data.mid
                    },connectionId)
                    //
                    s.txWithSubPermissions({
                        f:'video_build_success',
                        hrefNoAuth:'/videos/'+data.ke+'/'+data.mid+'/'+filename,
                        filename:filename,
                        mid:data.mid,
                        ke:data.ke,
                        time:data.time,
                        size:data.filesize,
                        end:data.end
                    },'GRP_'+data.ke,'video_view')
                    //save database row
                    var insert = {
                        startTime : data.time,
                        filesize : data.filesize,
                        endTime : data.end,
                        dir : s.getVideoDirectory(data.d),
                        file : filename,
                        filename : filename,
                        filesizeMB : parseFloat((data.filesize/1048576).toFixed(2))
                    }
                    s.insertDatabaseRow(data.d,insert)
                    s.insertCompletedVideoExtensions.forEach(function(extender){
                        extender(data.d,insert)
                    })
                    //purge over max
                    s.purgeDiskForGroup(data.ke)
                    //send new diskUsage values
                    s.setDiskUsedForGroup(data.ke,insert.filesizeMB)
                    clearTimeout(activeMonitor.recordingChecker)
                    clearTimeout(activeMonitor.streamChecker)
                    resolve(response)
                },2000)
            })
        })
    }
    function initiateTimelapseFrameWriteFromChildNode(client,data,connectionId){
        return new Promise((resolve,reject) => {
            const groupKey = data.ke
            const monitorId = data.mid
            const filename = data.filename
            const currentDate = data.currentDate
            const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
            const monitorConfig = s.group[groupKey].rawMonitorConfigurations[monitorId]
            const timelapseFrameDirectory = s.getTimelapseFrameDirectory(monitorConfig) + currentDate + `/`
            const fileWritePath = timelapseFrameDirectory + filename
            const writeStream = fs.createWriteStream(fileWritePath)
            data.writeDirectory = timelapseFrameDirectory
            initiateFileWriteFromChildNode(client,data,connectionId,(response) => {
                setTimeout(() => {
                    s.cx({
                        f: 'deleteTimelapseFrame',
                        file: filename,
                        currentDate: currentDate,
                        ke: groupKey,
                        mid: monitorId
                    },connectionId)
                    s.insertTimelapseFrameDatabaseRow({
                        ke: groupKey
                    },data.queryInfo)
                    resolve(response)
                },2000)
            })
        })
    }
    return {
        initiateDataConnection,
        onWebSocketDataFromChildNode,
        onDataConnectionDisconnect,
        initiateVideoWriteFromChildNode,
        initiateTimelapseFrameWriteFromChildNode,
    }
}
