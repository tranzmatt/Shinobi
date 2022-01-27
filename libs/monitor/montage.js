module.exports = (s,config,lang) => {
    const {
        buildMontageString,
    } = require('./libs/ffmpeg/builders.js')(s,config,lang)
    const spawnMontageProcess = function(monitors){
        // e = monitorConfig
        try{
            const firstMonitor = monitors[0]
            const groupKey = firstMonitor.ke
            const monitorId = firstMonitor.mid
            const theGroup = s.group[groupKey]
            const monitorConfig = Object.assign({},s.group[groupKey].rawMonitorConfigurations[monitorId])
            const monitorDetails = monitorConfig.details
            const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
            const ffmpegCommand = [`-progress pipe:5`];
            const logLevel = monitorDetails.loglevel ? e.details.loglevel : 'warning'
            const ffmpegCommandString = buildMontageString(monitors,true)
            activeMonitor.ffmpegSubstream = sanitizedFfmpegCommand(e,ffmpegCommandString)
            const ffmpegCommandParsed = splitForFFPMEG(ffmpegCommandString)
            s.userLog({
                ke: groupKey,
                mid: '$USER',
            },
            {
                type: lang["Montage Process"],
                msg: {
                    msg: lang["Process Started"],
                    cmd: ffmpegCommandString,
                },
            });
            const montageProcess = spawn(config.ffmpegDir,ffmpegCommandParsed,{detached: true,stdio: stdioPipes})
            if(config.debugLog === true){
                montageProcess.stderr.on('data',(data) => {
                    console.log(`Montage Debug, ${groupKey} :`)
                    console.log(data.toString())
                })
            }
            if(logLevel !== 'quiet'){
                montageProcess.stderr.on('data',(data) => {
                    s.userLog({
                        ke: groupKey,
                        mid: '$USER',
                    },{
                        type: lang["Montage Process"],
                        msg: data.toString()
                    })
                })
            }
            montageProcess.on('close',(data) => {
                if(!theGroup.allowDestroyMontage){
                    montageProcess.stderr.on('data',(data) => {
                        s.userLog({
                            ke: groupKey,
                            mid: '$USER',
                        },
                        {
                            type: lang["Montage Process"],
                            msg: lang["Process Crashed for Monitor"],
                        })
                    })
                    setTimeout(() => {
                        spawnMontageProcess(e)
                    },2000)
                }
            })
            s.tx({
                f: 'montage_start',
                ke: groupKey,
            },'GRP_'+groupKey);
            return montageProcess
        }catch(err){
            s.systemLog(err)
            return null
        }
    }
    const destroyMontageProcess = async function(activeMonitor){
        // e = monitorConfig.details.substream
        const response = {
            hadSubStream: false,
            alreadyClosing: false
        }
        try{
            if(activeMonitor.subStreamProcessClosing){
                response.alreadyClosing = true
            }else if(activeMonitor.subStreamProcess){
                activeMonitor.subStreamProcessClosing = true
                activeMonitor.subStreamChannel = null;
                const closeResponse = await processKill(activeMonitor.subStreamProcess)
                response.hadSubStream = true
                response.closeResponse = closeResponse
                delete(activeMonitor.subStreamProcess)
                s.tx({
                    f: 'montage_end',
                    mid: activeMonitor.mid,
                    ke: activeMonitor.ke
                },'GRP_'+activeMonitor.ke);
                activeMonitor.subStreamProcessClosing = false
            }
        }catch(err){
            s.debugLog('destroySubstreamProcess',err)
        }
        return response
    }
    return {

    }
}
