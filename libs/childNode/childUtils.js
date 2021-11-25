module.exports = function(s,config,lang,app,io){
    const queuedSqlCallbacks = s.queuedSqlCallbacks;
    function onDataFromMasterNode(d) {
        switch(d.f){
            case'sqlCallback':
                const callbackId = d.callbackId;
                if(queuedSqlCallbacks[callbackId]){
                    queuedSqlCallbacks[callbackId](d.err,d.rows)
                    delete(queuedSqlCallbacks[callbackId])
                }
            break;
            case'init_success':
                s.connected=true;
                s.other_helpers=d.child_helpers;
            break;
            case'kill':
                s.initiateMonitorObject(d.d);
                cameraDestroy(d.d)
                var childNodeIp = s.group[d.d.ke].activeMonitors[d.d.id]
            break;
            case'sync':
                s.initiateMonitorObject(d.sync);
                Object.keys(d.sync).forEach(function(v){
                    s.group[d.sync.ke].activeMonitors[d.sync.mid][v]=d.sync[v];
                });
            break;
            case'delete'://delete video
                s.file('delete',s.dir.videos+d.ke+'/'+d.mid+'/'+d.file)
            break;
            case'deleteTimelapseFrame'://delete video
            var filePath = s.getTimelapseFrameDirectory(d.d) + `${d.currentDate}/` + d.file
                s.file('delete',filePath)
            break;
            case'insertCompleted'://close video
                s.insertCompletedVideo(d.d,d.k)
            break;
            case'cameraStop'://start camera
                s.camera('stop',d.d)
            break;
            case'cameraStart'://start or record camera
                s.camera(d.mode,d.d)
            break;
        }
    }
    return {
        onDataFromMasterNode,
    }
}
