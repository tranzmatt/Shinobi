module.exports = function(s,config,lang,app,io){
    const { cameraDestroy } = require('../monitor/utils.js')(s,config,lang)
    const queuedSqlCallbacks = s.queuedSqlCallbacks;
    var checkCpuInterval = null;
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
                s.connectedToMasterNode = true;
                s.other_helpers=d.child_helpers;
            break;
            case'kill':
                s.initiateMonitorObject(d.d);
                cameraDestroy(d.d)
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
    function initiateConnectionToMasterNode(){
        console.log('CHILD CONNECTION SUCCESS')
        s.cx({
            f: 'init',
            port: config.port,
            coreCount: s.coreCount,
            availableHWAccels: config.availableHWAccels,
            socketKey: config.childNodes.key
        })
        clearInterval(checkCpuInterval)
        checkCpuInterval = setInterval(async () => {
            sendCurrentCpuUsage()
        },5000)
    }
    function onDisconnectFromMasterNode(){
        s.connectedToMasterNode = false;
        destroyAllMonitorProcesses()
    }
    function destroyAllMonitorProcesses(){
        var groupKeys = Object.keys(s.group)
        groupKeys.forEach(function(groupKey){
            var activeMonitorKeys = Object.keys(s.group[groupKey].activeMonitors)
            activeMonitorKeys.forEach(function(monitorKey){
                var activeMonitor = s.group[groupKey].activeMonitors[monitorKey]
                if(activeMonitor && activeMonitor.spawn && activeMonitor.spawn.close)activeMonitor.spawn.close()
                if(activeMonitor && activeMonitor.spawn && activeMonitor.spawn.kill)activeMonitor.spawn.kill()
            })
        })
    }
    function sendCurrentCpuUsage(){
        const cpu = await s.cpuUsage()
        s.cx({
            f: 'cpu',
            cpu: parseFloat(cpu)
        })
    }
    return {
        onDataFromMasterNode,
        initiateConnectionToMasterNode,
        onDisconnectFromMasterNode,
        destroyAllMonitorProcesses,
        sendCurrentCpuUsage,
    }
}
