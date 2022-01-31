const fs = require('fs');
const spawn = require('child_process').spawn;
module.exports = (s,config,lang) => {
    const {
        buildMontageString,
    } = require('../ffmpeg/builders.js')(s,config,lang)
    const {
        processKill,
    } = require('../monitor/utils.js')(s,config,lang)
    const {
        sanitizedFfmpegCommand,
        splitForFFPMEG,
    } = require('../ffmpeg/utils.js')(s,config,lang)
    const spawnMontageProcess = function(groupKey,monitorIds,reusePriorConsumption){
        // e = monitorConfig
        try{
            const theGroup = s.group[groupKey]
            const monitorConfigs = []
            monitorIds.forEach((monitorId) => {
                const monitorConfig = Object.assign({},s.group[groupKey].rawMonitorConfigurations[monitorId])
                const monitorDetails = monitorConfig.details
                const activeMonitor = s.group[groupKey].activeMonitors[monitorId]
                monitorConfigs.push(monitorConfig)
            })
            const ffmpegCommandString = buildMontageString(monitorConfigs,reusePriorConsumption)
            theGroup.ffmpegMontage = sanitizedFfmpegCommand({details: {}},ffmpegCommandString)
            const ffmpegCommandParsed = splitForFFPMEG(ffmpegCommandString)
            console.log(ffmpegCommandString)
            try{
                fs.mkdirSync(`${s.dir.streams}${groupKey}/montage_temp`)
            }catch(err){
                s.debugLog(err)
            }
            s.userLog({
                ke: groupKey,
                mid: '$USER',
            },{
                type: lang["Montage Process"],
                msg: {
                    msg: lang["Process Started"],
                    cmd: ffmpegCommandString,
                },
            });
            const montageProcess = spawn(config.ffmpegDir,ffmpegCommandParsed,{detached: true, stdio: ['pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe','pipe']})
            if(config.debugLog === true){
                montageProcess.stderr.on('data',(data) => {
                    console.log(`Montage Debug, ${groupKey} :`)
                    console.log(data.toString())
                })
            }
            montageProcess.stderr.on('data',(data) => {
                s.userLog({
                    ke: groupKey,
                    mid: '$USER',
                },{
                    type: lang["Montage Process"],
                    msg: data.toString()
                })
            })
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
                        spawnMontageProcess(groupKey,monitorIds)
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
                    ke: groupKey
                },'GRP_'+groupKey);
                theGroup.montageProcessClosing = false
            }
        }catch(err){
            s.debugLog('destroyMontageProcess',err)
        }
        return response
    }
    return {
        spawnMontageProcess,
        destroyMontageProcess,
    }
}
