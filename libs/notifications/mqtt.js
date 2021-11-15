var fs = require("fs")
module.exports = function(s,config,lang,getSnapshot){
    if(config.mqttClient === true){
        const {
            getEventBasedRecordingUponCompletion,
        } = require('../events/utils.js')(s,config,lang)
        try{
            const availableExtenders = ['onMonitorSave', 'onMonitorStart', 'onMonitorStop', 'onMonitorDied', 'onEventTrigger', 'onDetectorNoTriggerTimeout', 'onAccountSave', 'onUserLog', 'onTwoFactorAuthCodeNotification']
            function sendToMqttConnections(groupKey,eventName,addedArgs,checkMonitors){
                s.group[groupKey].mqttOutbounderKeys.forEach(function(key){
                    const outBounder = s.group[groupKey].mqttOutbounders[key]
                    const theAction = outBounder.eventHandlers[eventName]
                    if(checkMonitors){
                        const monitorsToRead = outBounder.monitorsToRead
                        const firstArg = addedArgs[0]
                        const monitorId = firstArg.mid || firstArg.id
                        if(monitorsToRead.indexOf(monitorId) > -1 || monitorsToRead.indexOf('$all') > -1)theAction(..addedArgs);
                    }else{
                        theAction(..addedArgs)
                    }
                })
            }
            const sendMessage = async function(options,data){
                const sendBody = s.stringJSON(data)
                const groupKey = options.ke
                const subId = options.subId
                const publishTo = options.to
                try{
                    s.group[groupKey].mqttOutbounders[subId].client.publish(publishTo,sendBody)
                }catch(err){
                    s.debugLog('MQTT Error',err)
                    s.userLog({ke:groupKey,mid:'$USER'},{type:lang['MQTT Error'],msg:err})
                }
            }
            const onEventTriggerBeforeFilter = function(d,filter){
                filter.mqttout = false
            }
            const onTwoFactorAuthCodeNotification = function(r){
                // r = user
                if(r.details.factor_mqttout === '1'){
                    sendMessage({
                        title: r.lang['Enter this code to proceed'],
                        description: '**'+s.factorAuth[r.ke][r.uid].key+'** '+r.lang.FactorAuthText1,
                    },[],r.ke)
                }
            }
            const onDetectorNoTriggerTimeout = function(e){
                if(e.details.detector_notrigger_mqttout === '1'){
                    const groupKey = e.ke
                    sendToMqttConnections(groupKey,'onDetectorNoTriggerTimeout',[e],true)
                }
            }
            const onEventTrigger = (d,filter) => {
                if((filter.mqttout || monitorConfig.details.notify_mqttout === '1') && !s.group[d.ke].activeMonitors[d.id].detector_mqttout){
                    var detector_mqttout_timeout
                    if(!monitorConfig.details.detector_mqttout_timeout||monitorConfig.details.detector_mqttout_timeout===''){
                        detector_mqttout_timeout = 1000 * 60 * 10;
                    }else{
                        detector_mqttout_timeout = parseFloat(monitorConfig.details.detector_mqttout_timeout) * 1000 * 60;
                    }
                    s.group[d.ke].activeMonitors[d.id].detector_mqttout = setTimeout(function(){
                        clearTimeout(s.group[d.ke].activeMonitors[d.id].detector_mqttout);
                        s.group[d.ke].activeMonitors[d.id].detector_mqttout = null
                    },detector_mqttout_timeout)
                    //
                    const groupKey = d.ke
                    sendToMqttConnections(groupKey,'onEventTrigger',[d,filter],true)
                }
            }
            const onMonitorDied = (monitorConfig) => {
                const groupKey = monitorConfig.ke
                sendToMqttConnections(groupKey,'onMonitorDied',[monitorConfig],true)
            }

            const loadMqttListBotForUser = function(user){
                const groupKey = user.ke
                const userDetails = s.parseJSON(user.details);
                if(userDetails.mqttout === '1'){
                    const mqttClientList = userDetails.mqttout_list || []
                    if(!s.group[groupKey].mqttOutbounders)s.group[groupKey].mqttOutbounders = {};
                    const mqttSubs = s.group[groupKey].mqttOutbounders
                    mqttClientList.forEach(function(row,n){
                        try{
                            const mqttSubId = `${row.host} ${row.pubKey}`
                            const message = row.type || []
                            const eventsToAttachTo = row.msgFor || []
                            const monitorsToRead = row.monitors || []
                            mqttSubs[mqttSubId] = {
                                eventHandlers: {}
                            };
                            mqttSubs[mqttSubId].client = createMqttSubscription({
                                host: row.host,
                                pubKey: row.pubKey,
                                ke: groupKey,
                            });
                            const msgOptions = {
                                ke: groupKey,
                                subId: mqttSubId,
                                to: row.pubKey,
                            }
                            const titleLegend = {
                                onMonitorSave: lang['Monitor Edit'],
                                onMonitorStart: lang['Monitor Start'],
                                onMonitorStop: lang['Monitor Stop'],
                                onMonitorDied: lang['Monitor Died'],
                                onEventTrigger: lang['Event'],
                                onDetectorNoTriggerTimeout: lang['"No Motion" Detector'],
                                onAccountSave: lang['Account Save'],
                                onUserLog: lang['User Log'],
                                onTwoFactorAuthCodeNotification: lang['2-Factor Authentication'],
                            }
                            eventsToAttachTo.forEach(function(eventName){
                                let theAction = function(){}
                                switch(eventName){
                                    case'onEventTrigger':
                                        theAction = function(d,filter){
                                            const eventObject = Object.assign({},d)
                                            delete(eventObject.frame);
                                            sendMessage(msgOptions,{
                                                title: titleLegend[eventName],
                                                name: eventName,
                                                data: eventObject,
                                                time: new Date(),
                                            })
                                        }
                                    break;
                                    case'onAccountSave':
                                        theAction = function(activeGroup,userDetails,user){
                                            sendMessage(msgOptions,{
                                                title: titleLegend[eventName],
                                                name: eventName,
                                                data: {
                                                    mail: user.mail,
                                                    ke: user.ke,
                                                },
                                                time: new Date(),
                                            })
                                        }
                                    break;
                                    case'userLog':
                                        theAction = function(logEvent){
                                            sendMessage(msgOptions,{
                                                title: titleLegend[eventName],
                                                name: eventName,
                                                data: logEvent
                                            })
                                        }
                                    break;
                                    case'onMonitorSave':
                                    case'onMonitorStart':
                                    case'onMonitorStop':
                                    case'onMonitorDied':
                                    case'onDetectorNoTriggerTimeout':
                                        theAction = function(monitorConfig){
                                            //e = monitor object
                                            sendMessage(msgOptions,{
                                                title: titleLegend[eventName],
                                                name: eventName,
                                                data: {
                                                    name: monitorConfig.name,
                                                    monitorId: e.mid || e.id,
                                                },
                                                time: new Date(),
                                            })
                                        }
                                    break;
                                }
                                mqttSubs[mqttSubId].eventHandlers[eventName] = theAction
                            })
                            mqttSubs[mqttSubId].monitorsToRead = monitorsToRead;
                        }catch(err){
                            s.debugLog(err)
                            // s.systemLog(err)
                        }
                    })
                    s.group[groupKey].mqttOutbounderKeys = Object.keys(s.group[groupKey].mqttOutbounders)
                }else{
                    s.group[groupKey].mqttOutbounderKeys = []
                }
            }
            const unloadMqttListBotForUser = function(user){
                const groupKey = user.ke
                const mqttSubs = s.group[groupKey].mqttOutbounders || {}
                Object.keys(mqttSubs).forEach(function(mqttSubId){
                    try{
                        mqttSubs[mqttSubId].client.end()
                    }catch(err){
                        s.debugLog(err)
                        // s.userLog({
                        //     ke: groupKey,
                        //     mid: '$USER'
                        // },{
                        //     type: lang['MQTT Error'],
                        //     msg: err
                        // })
                    }
                    delete(mqttSubs[mqttSubId])
                })
            }
            const onBeforeAccountSave = function(data){
                data.d.mqttout_list = []
            }
            s.loadGroupAppExtender(loadMqttListBotForUser)
            s.unloadGroupAppExtender(unloadMqttListBotForUser)
            s.beforeAccountSave(onBeforeAccountSave)
            s.onTwoFactorAuthCodeNotification(onTwoFactorAuthCodeNotification)
            s.onEventTrigger(onEventTrigger)
            s.onEventTriggerBeforeFilter(onEventTriggerBeforeFilter)
            s.onDetectorNoTriggerTimeout(onDetectorNoTriggerTimeout)
            s.onMonitorDied(onMonitorDied)
            s.definitions["Monitor Settings"].blocks["Notifications"].info[0].info.push(
                {
                   "name": "detail=notify_mqttout",
                   "field": lang['MQTT Outbound'],
                   "description": "",
                   "default": "0",
                   "example": "",
                   "selector": "h_det_mqttout",
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
            )
            s.definitions["Monitor Settings"].blocks["Notifications"].info.push({
               "evaluation": "$user.details.use_mqttout !== '0'",
               isFormGroupGroup: true,
               "name": lang['MQTT Outbound'],
               "color": "blue",
               "section-class": "h_det_mqttout_input h_det_mqttout_1",
               "info": [
                   {
                      "name": "detail=detector_mqttout_timeout",
                      "field": lang['Allow Next Alert'] + ` (${lang['on Event']})`,
                      "description": "",
                      "default": "10",
                      "example": "",
                      "possible": ""
                   },
               ]
            })
            s.definitions["Account Settings"].blocks["2-Factor Authentication"].info.push({
                "name": "detail=factor_mqttout",
                "field": lang['MQTT Outbound'],
                "default": "1",
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
            })
            s.definitions["Account Settings"].blocks["MQTT Outbound"] = {
               "evaluation": "$user.details.use_mqttout !== '0'",
               "name": lang['MQTT Outbound'],
               "color": "blue",
               "info": [
                   {
                      "name": "detail=mqttout",
                      "selector":"u_mqttout",
                      "field": lang.Enabled,
                      "default": "0",
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
                      "fieldType": "btn",
                      "class": `btn-success mqtt-add-row`,
                      "btnContent": `<i class="fa fa-plus"></i> &nbsp; ${lang['Add']}`,
                   },
                   {
                      "id": "mqttout_list",
                      "fieldType": "div",
                  },
                   {
                      "fieldType": "script",
                      "src": "assets/js/bs5.mqttOut.js",
                   }
               ]
            }
            s.definitions["Event Filters"].blocks["Action for Selected"].info.push({
                 "name": "actions=mqttout",
                 "field": lang['MQTT Outbound'],
                 "fieldType": "select",
                 "form-group-class": "actions-row",
                 "default": "",
                 "example": "1",
                 "possible": [
                    {
                       "name": lang['Original Choice'],
                       "value": "",
                       "selected": true
                    },
                    {
                       "name": lang.Yes,
                       "value": "1",
                    }
                 ]
            })
        }catch(err){
            console.error(err)
            console.log('Could not start MQTT Outbound Handling.')
        }
    }
}
