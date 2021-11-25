module.exports = function(s,config,lang,app,io){
    function getIpAddress(req){
        return (req.headers['cf-connecting-ip'] ||
            req.headers["CF-Connecting-IP"] ||
            req.headers["'x-forwarded-for"] ||
            req.connection.remoteAddress).replace('::ffff:','');
    }
    function initiateDataConnection(client,req,options){
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
            childNodes : s.childNodes
        })
        activeNode.coreCount = options.coreCount
        console.log('Initiated Child Node : ', ipAddress)
        return ipAddress
    }
    function initiateVideoTransferConnection(){

    }
    function onWebSocketData(client,data){
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
            case'open_timelapse_file_transfer':
                var location = s.getTimelapseFrameDirectory(data.d) + `${data.currentDate}/`
                if(!fs.existsSync(location)){
                    fs.mkdirSync(location)
                }
            break;
            case'created_timelapse_file_chunk':
                if(!activeMonitor.childNodeStreamWriters[data.filename]){
                    var dir = s.getTimelapseFrameDirectory(data.d) + `${data.currentDate}/`
                    activeMonitor.childNodeStreamWriters[data.filename] = fs.createWriteStream(dir+data.filename)
                }
                activeMonitor.childNodeStreamWriters[data.filename].write(data.chunk)
            break;
            case'created_timelapse_file':
                if(!activeMonitor.childNodeStreamWriters[data.filename]){
                    return console.log('FILE NOT EXIST')
                }
                activeMonitor.childNodeStreamWriters[data.filename].end()
                client.sendJson({
                    f: 'deleteTimelapseFrame',
                    file: data.filename,
                    currentDate: data.currentDate,
                    d: data.d, //monitor config
                    ke: data.ke,
                    mid: data.mid
                })
                s.insertTimelapseFrameDatabaseRow({
                    ke: data.ke
                },data.queryInfo)
            break;
            case'created_file_chunk':
                if(!activeMonitor.childNodeStreamWriters[data.filename]){
                    data.dir = s.getVideoDirectory(s.group[data.ke].rawMonitorConfigurations[data.mid])
                    if (!fs.existsSync(data.dir)) {
                        fs.mkdirSync(data.dir, {recursive: true}, (err) => {s.debugLog(err)})
                    }
                    activeMonitor.childNodeStreamWriters[data.filename] = fs.createWriteStream(data.dir+data.filename)
                }
                activeMonitor.childNodeStreamWriters[data.filename].write(data.chunk)
            break;
            case'created_file':
                if(!activeMonitor.childNodeStreamWriters[data.filename]){
                    return console.log('FILE NOT EXIST')
                }
                activeMonitor.childNodeStreamWriters[data.filename].end();
                client.sendJson({
                    f:'delete',
                    file:data.filename,
                    ke:data.ke,
                    mid:data.mid
                })
                s.txWithSubPermissions({
                    f:'video_build_success',
                    hrefNoAuth:'/videos/'+data.ke+'/'+data.mid+'/'+data.filename,
                    filename:data.filename,
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
                    file : data.filename,
                    filename : data.filename,
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
    return {
        initiateDataConnection,
        initiateVideoTransferConnection,
        onWebSocketData,
        onDataConnectionDisconnect,
    }
}
