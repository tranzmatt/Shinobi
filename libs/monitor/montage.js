module.exports = (s,config,lang) => {
    const {
        buildMontageString,
    } = require('./libs/ffmpeg/builders.js')(s,config,lang)
    const spawnMontageProcess = function(groupKey,monitorIds){
        // e = monitorConfig
        try{
            const theGroup = s.group[groupKey]
            const monitorConfigs = []
            monitorIds.forEach((monitor) => {
                const monitorId = monitor.mid
                const monitorConfig = Object.assign({},s.group[groupKey].rawMonitorConfigurations[monitorId])
                const monitorDetails = monitorConfig.details
                const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
                monitorConfigs.push(monitorConfig)
            })

            const ffmpegCommand = [`-progress pipe:5`];
            const logLevel = monitorDetails.loglevel ? e.details.loglevel : 'warning'
            const ffmpegCommandString = buildMontageString(monitorConfigs,true)
            theGroup.ffmpegMontage = sanitizedFfmpegCommand(e,ffmpegCommandString)
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
            theGroup.montageProcess = montageProcess
            return montageProcess
        }catch(err){
            s.systemLog(err)
            return null
        }
    }
    const destroyMontageProcess = async function(groupKey){
        const response = {
            hadMontage: false,
            alreadyClosing: false
        }
        try{
            const theGroup = s.group[groupKey]
            if(theGroup.montageProcessClosing){
                response.alreadyClosing = true
            }else if(theGroup.montageProcess){
                theGroup.montageProcessClosing = true
                const closeResponse = await processKill(theGroup.montageProcess)
                response.hadMontage = true
                response.closeResponse = closeResponse
                delete(theGroup.montageProcess)
                s.tx({
                    f: 'montage_end',
                    ke: activeMonitor.ke
                },'GRP_'+activeMonitor.ke);
                activeMonitor.montageProcessClosing = false
            }
        }catch(err){
            s.debugLog('destroyMontageProcess',err)
        }
        return response
    }
    return {

    }
}
