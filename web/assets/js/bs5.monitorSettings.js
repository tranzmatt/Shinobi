$(document).ready(function(e){

//Monitor Editor
var monitorEditorWindow = $('#tab-monitorSettings')
var monitorEditorTitle = $('#tab-monitorSettings-title')
var monitorsForCopy = $('#copy_settings_monitors')
var monitorSectionInputMaps = $('#monSectionInputMaps')
var monitorStreamChannels = $('#monSectionStreamChannels')
var monSectionPresets = $('#monSectionPresets')
var copySettingsSelector = $('#copy_settings')
var monitorPresetsSelection = $('#monitorPresetsSelection')
var monitorPresetsNameField = $('#monitorPresetsName')
var monitorsList = monitorEditorWindow.find('.monitors_list')
var editorForm = monitorEditorWindow.find('form')
var tagsInput = monitorEditorWindow.find('[name="tags"]')
var triggerTagsInput = monitorEditorWindow.find('[detail=det_trigger_tags]')
var fieldsLoaded = {}
var sections = {}
var loadedPresets = {}
var getHumanizedMonitorConfig = function(monitor){
    var humanizedMonitorKeys = {}
    $.each(monitor,function(key,value){
        if(key === 'details'){
            humanizedMonitorKeys.details = {}
            $.each(value,function(key,value){
                humanizedMonitorKeys.details[fieldsLoaded[`detail=${key}`] && fieldsLoaded[`detail=${key}`].field ? fieldsLoaded[`detail=${key}`].field + ` (${key})` : key] = value
            })
        }else{
            humanizedMonitorKeys[fieldsLoaded[key] && fieldsLoaded[key].field ? fieldsLoaded[key].field : key] = value
        }
    })
    return humanizedMonitorKeys
}
var getSelectedMonitorInfo = function(){
    var groupKey = monitorEditorWindow.attr('data-ke')
    var monitorId = monitorEditorWindow.attr('data-mid')
    return {
        ke: groupKey,
        mid: monitorId,
        auth: $user.auth_token,
    }
}
var differentiateMonitorConfig = function(firstConfig,secondConfig){
    console.log(firstConfig,secondConfig)
    var diffedConfig = {}
    var firstConfigEditable = Object.assign(firstConfig,{details:safeJsonParse(firstConfig.details)})
    var secondConfigEditable = Object.assign(secondConfig,{details:safeJsonParse(secondConfig.details)})
    var theDiff = diffObject(firstConfigEditable,secondConfigEditable)
    console.log(theDiff)
    return theDiff
}
var copyMonitorSettingsToSelected = function(monitorConfig){
    var monitorDetails = safeJsonParse(monitorConfig.details);
    var copyMonitors = monitorsForCopy.val().filter((monitorId) => {
        return monitorConfig.mid !== monitorId
    });
    var chosenSections = [];
    var chosenMonitors = {};

    if(!copyMonitors||copyMonitors.length===0){
        new PNotify({title:lang['No Monitors Selected'],text:lang.monSavedButNotCopied})
        return
    }

    monitorEditorWindow.find('[copy]').each(function(n,v){
        var el = $(v)
        if(el.val() === '1'){
            chosenSections.push(el.attr('copy'))
        }
    })
    var alterSettings = function(settingsToAlter,monitor){
        monitor.details = safeJsonParse(monitor.details);
        var searchElements = []
        if(settingsToAlter.indexOf('field=') > -1){
            var splitSettingsToAlter = settingsToAlter.split('=')
            if(splitSettingsToAlter[1] === 'detail' && splitSettingsToAlter[2]){
                searchElements = monitorEditorWindow.find(`[detail="${splitSettingsToAlter[2]}"]`)
            }else{
                searchElements = monitorEditorWindow.find(`[name="${splitSettingsToAlter[1]}"]`)
            }
        }else{
            searchElements = monitorEditorWindow.find(settingsToAlter).find('input,select,textarea')
        }
        searchElements.each(function(n,v){
            var el = $(v);
            var name = el.attr('name')
            var detail = el.attr('detail')
            var value
            switch(true){
                case !!name:
                    var value = monitorConfig[name]
                    monitor[name] = value;
                break;
                case !!detail:
                    detail = detail.replace('"','')
                    var value = monitorDetails[detail]
                    monitor.details[detail] = value;
                break;
            }
        })
        monitor.details = JSON.stringify(monitor.details);
        return monitor;
    }
    $.each(copyMonitors,function(n,id){
        var monitor
        if(monitorConfig.id === id)return;
        if(id === '$New'){
            monitor = generateDefaultMonitorSettings();
            //connection
            monitor.name = monitorConfig.name+' - '+monitor.mid
            monitor.type = monitorConfig.type
            monitor.protocol = monitorConfig.protocol
            monitor.host = monitorConfig.host
            monitor.port = monitorConfig.port
            monitor.path = monitorConfig.path
            monitor.details.fatal_max = monitorDetails.fatal_max
            monitor.details.port_force = monitorDetails.port_force
            monitor.details.muser = monitorDetails.muser
            monitor.details.password = monitorDetails.password
            monitor.details.rtsp_transport = monitorDetails.rtsp_transport
            monitor.details.auto_host = monitorDetails.auto_host
            monitor.details.auto_host_enable = monitorDetails.auto_host_enable
            //input
            monitor.details.aduration = monitorDetails.aduration
            monitor.details.probesize = monitorDetails.probesize
            monitor.details.stream_loop = monitorDetails.stream_loop
            monitor.details.sfps = monitorDetails.sfps
            monitor.details.accelerator = monitorDetails.accelerator
            monitor.details.hwaccel = monitorDetails.hwaccel
            monitor.details.hwaccel_vcodec = monitorDetails.hwaccel_vcodec
            monitor.details.hwaccel_device = monitorDetails.hwaccel_device
        }else{
            monitor = Object.assign({},loadedMonitors[id]);
        }
        $.each(chosenSections,function(n,section){
            monitor = alterSettings(section,monitor)
        })
        $.post(getApiPrefix()+'/configureMonitor/'+$user.ke+'/'+monitor.mid,{data:JSON.stringify(monitor)},function(d){
            debugLog(d)
        })
        chosenMonitors[monitor.mid] = monitor;
    })
}
function drawMonitorSettingsSubMenu(){
    drawSubMenuItems('monitorSettings',definitions['Monitor Settings'])
}

function getAdditionalInputMapFields(tempID,channelId){
    var fieldInfo = monitorSettingsAdditionalInputMapFieldHtml.replaceAll('$[TEMP_ID]',tempID).replaceAll('$[NUMBER]',channelId)
    return fieldInfo
}

function getAdditionalStreamChannelFields(tempID,channelId){
    var fieldInfo = monitorSettingsAdditionalStreamChannelFieldHtml.replaceAll('$[TEMP_ID]',tempID).replaceAll('$[NUMBER]',channelId)
    return fieldInfo
}
function drawInputMapHtml(options){
    var tmp = ''
    var tempID = generateId()
    options = options ? options : {}
    if(!options.channel){
        var numberOfChannelsDrawn = $('#monSectionInputMaps .input-map').length
        options.channel = numberOfChannelsDrawn+1
    }
    tmp += getAdditionalInputMapFields(tempID,options.channel)
    monitorSectionInputMaps.append(tmp)
    monitorSectionInputMaps.find('.input-map').last().find('[map-detail="aduration"]').change()
    return tempID;
}
function drawStreamChannelHtml(options){
    var tmp = ''
    var tempID = generateId()
    options = options ? options : {}
    if(!options.channel){
        var numberOfChannelsDrawn = $('#monSectionStreamChannels .stream-channel').length
        options.channel=numberOfChannelsDrawn
    }
    tmp += `${getAdditionalStreamChannelFields(tempID,options.channel)}`
    monitorStreamChannels.append(tmp)
    monitorStreamChannels.find('.stream-channel').last().find('[channel-detail="stream_vcodec"]').change()
    return tempID;
}
function replaceMap(string,mapNumber){
    var newString = string.split(':')
    newString[0] = `${mapNumber}`
    return newString.join(':')
}
function replaceMapInName(string,mapNumber){
    var newString = string.split('(')
    newString[1] = replaceMap(newString[1],mapNumber)
    var lastIndex = newString.length - 1
    if(!newString[lastIndex].endsWith(')')){
        newString[lastIndex] = newString + ')'
    }
    return newString.join('(')
}
function buildMapSelectorOptionsBasedOnAddedMaps(){
    var baseOptionSet = definitions['Monitor Settings'].blocks.Input.info.find((item) => {return item.name === 'detail=primary_input'}).possible
    var newOptGroup = [baseOptionSet]
    var addedInputMaps = monitorEditorWindow.find('.input-map')
    $.each(addedInputMaps,function(n){
        var mapNumber = n + 1
        var newOptionSet = []
        $.each(baseOptionSet,function(nn,option){
            newOptionSet.push({
                "name": replaceMapInName(option.name,mapNumber),
                "value": replaceMap(option.value,mapNumber)
            })
        })
        newOptGroup[mapNumber] = newOptionSet
    })
    return newOptGroup
}
function drawInputMapSelectorHtml(options,parent){
    if(!options.map)options.map = '';
    var availableInputMapSelections = buildMapSelectorOptionsBasedOnAddedMaps()
    var html = `<div class="map-row form-group map-row d-flex flex-row">
        <div class="flex-grow-1">
            <select class="form-control form-control-sm" map-input="map">`
                    $.each(availableInputMapSelections,function(n,optgroup){
                        html += `<optgroup label="${lang['Map']} ${n}">`
                            $.each(optgroup,function(nn,option){
                                html += createOptionHtml({
                                    label: option.name,
                                    value: option.value,
                                    selected: option.value === options.map,
                                })
                            })
                        html += `</optgroup>`
                    })
            html += `</select>
        </div>
        <div>
            <a class="btn btn-danger btn-sm delete_map_row">&nbsp;<i class="fa fa-trash-o"></i>&nbsp;</a>
        </div>
    </div>`
    parent.prepend(html)
}
function importIntoMonitorEditor(options){
    var monitorConfig = options.values || options
    var monitorId = monitorConfig.mid
    var monitorDetails = safeJsonParse(monitorConfig.details);
    var monitorTags = monitorConfig.tags ? monitorConfig.tags.split(',') : []
    var monitorGroups = monitorDetails.groups ? safeJsonParse(monitorDetails.groups) : []
    monitorTags = monitorTags.concat(monitorGroups)
    loadMonitorGroupTriggerList(monitorEditorSelectedMonitor,triggerTagsInput)
    $.get(getApiPrefix()+'/hls/'+monitorConfig.ke+'/'+monitorConfig.mid+'/detectorStream.m3u8',function(data){
        $('#monEditBufferPreview').html(data)
    })
    tagsInput.tagsinput('removeAll');
    monitorTags.forEach((tag) => {
        tagsInput.tagsinput('add',tag);
    });
    monitorEditorWindow.find('.edit_id').text(monitorConfig.mid);
    monitorEditorWindow.attr('data-mid',monitorConfig.mid).attr('data-ke',monitorConfig.ke)
    $.each(monitorConfig,function(n,v){
        monitorEditorWindow.find('[name="'+n+'"]').val(v).change()
    })
    //get maps
    monitorSectionInputMaps.empty()
    if(monitorDetails.input_maps && monitorDetails.input_maps !== ''){
        var input_maps = safeJsonParse(monitorDetails.input_maps)
        if(input_maps.length > 0){
            showInputMappingFields()
            $.each(input_maps,function(n,v){
                var tempID = drawInputMapHtml()
                var parent = $('#monSectionMap'+tempID)
                $.each(v,function(m,b){
                    parent.find('[map-detail="'+m+'"]').val(b).change()
                })
            })
        }else{
            showInputMappingFields(false)
        }
    }
    //get channels
    monitorStreamChannels.empty()
    if(monitorDetails.stream_channels&&monitorDetails.stream_channels!==''){
        var stream_channels
        try{
            stream_channels = safeJsonParse(monitorDetails.stream_channels)
        }catch(er){
            stream_channels = monitorDetails.stream_channels;
        }
        $.each(stream_channels,function(n,v){
            var tempID = drawStreamChannelHtml()
            var parent = $('#monSectionChannel'+tempID)
            $.each(v,function(m,b){
                parent.find('[channel-detail="'+m+'"]').val(b)
            })
        })
    }
    //get map choices for outputs
    monitorEditorWindow.find('[input-mapping] .choices').empty()
    if(monitorDetails.input_map_choices&&monitorDetails.input_map_choices!==''){
        var input_map_choices
        try{
            input_map_choices = safeJsonParse(monitorDetails.input_map_choices)
        }catch(er){
            input_map_choices = monitorDetails.input_map_choices;
        }
        $.each(input_map_choices,function(n,v){
            $.each(v,function(m,b){
                var parent = $('[input-mapping="'+n+'"] .choices')
                drawInputMapSelectorHtml(b,parent)
            })
        })
    }
    // substream
    $.each(['input','output'],function(n,direction){
        // detail-substream-input
        // detail-substream-output
        var keyName = `detail-substream-${direction}`
        monitorEditorWindow.find(`[${keyName}]`).each(function(n,el){
            var key = $(el).attr(keyName);
            var value = monitorDetails.substream && monitorDetails.substream[direction] ? monitorDetails.substream[direction][key] : ''
            monitorEditorWindow.find(`[${keyName}="${key}"]`).val(value).change();
        })
    })
    //
    monitorEditorWindow.find('[detail]').each(function(n,v){
        v=$(v).attr('detail');if(!monitorDetails[v]){monitorDetails[v]=''}
    })
    $.each(monitorDetails,function(n,v){
        var theVal = v;
        if(v instanceof Object){
            theVal = JSON.stringify(v);
        }
        monitorEditorWindow.find('[detail="'+n+'"]').val(theVal).change();
    });
    $.each(monitorDetails,function(n,v){
        try{
            var variable=safeJsonParse(v)
        }catch(err){
            var variable=v
        }
        if(variable instanceof Object){
            $('[detailContainer="'+n+'"][detailObject]').prop('checked',false)
            $('[detailContainer="'+n+'"][detailObject]').parents('.mdl-js-switch').removeClass('is-checked')
            if(variable instanceof Array){
                $.each(variable,function(m,b,parentOfObject){
                    $('[detailContainer="'+n+'"][detailObject="'+b+'"]').prop('checked',true)
                    parentOfObject=$('[detailContainer="'+n+'"][detailObject="'+b+'"]').parents('.mdl-js-switch')
                    parentOfObject.addClass('is-checked')
                })
            }else{
                $.each(variable,function(m,b){
                    if(typeof b ==='string'){
                       $('[detailContainer="'+n+'"][detailObject="'+m+'"]').val(b).change()
                    }else{
                        $('[detailContainer="'+n+'"][detailObject="'+m+'"]').prop('checked',true)
                        parentOfObject=$('[detailContainer="'+n+'"][detailObject="'+m+'"]').parents('.mdl-js-switch')
                        parentOfObject.addClass('is-checked')
                    }
                })
            }
        }
    });
    copySettingsSelector.val('0').change()
    var tmp = '';
    $.each(loadedMonitors,function(n,monitor){
        if(monitor.ke === $user.ke){
            tmp += createOptionHtml({
                value: monitor.mid,
                label: monitor.name
            })
        }
    })
    monitorsForCopy.find('optgroup').html(tmp)
    setFieldVisibility(editorForm)
    drawMonitorSettingsSubMenu()
}
//parse "Automatic" field in "Input" Section
monitorEditorWindow.on('change','.auto_host_fill input,.auto_host_fill select',function(e){
    var theSwitch = monitorEditorWindow.find('[detail="auto_host_enable"]').val()
    if(!theSwitch || theSwitch === ''){
        theSwitch = '1'
    }
    if(theSwitch === '1'){
        return
    }
    if(monitorEditorWindow.find('[name="host"]').val() !== ''){
        monitorEditorWindow.find('[detail="auto_host"]').val(buildMonitorURL())
    }
})
monitorEditorWindow.on('change','[detail="auto_host"]',function(e){
    var isRTSP = false
    var inputType = monitorEditorWindow.find('[name="type"]').val()
    var url = $(this).val()
    var theSwitch = monitorEditorWindow.find('[detail="auto_host_enable"]')
    var disabled = theSwitch.val()
    if(!disabled||disabled===''){
        //if no value, then probably old version of monitor config. Set to Manual to avoid confusion.
        disabled='0'
        theSwitch.val('0').change()
    }
    if(disabled==='0'){
        return
    }
    if(inputType === 'local'){
        monitorEditorWindow.find('[name="path"]').val(url).change()
    }else{
        var urlSplitByDots = url.split('.')
        var has = function(query,searchIn){if(!searchIn){searchIn=url;};return url.indexOf(query)>-1}
        var protocol = url.split('://')[0]
        console.log(url.split('://'))
        //switch RTSP, RTMP and RTMPS to parse URL
        if(has('rtsp://')){
            isRTSP = true;
            url = url.replace('rtsp://','http://')
        }
        if(has('rtmp://')){
            isRTMP = true;
            url = url.replace('rtmp://','http://')
        }
        if(has('rtmps://')){
            isRTMPS = true;
            url = url.replace('rtmps://','http://')
        }
        //parse URL
        var parsedURL = document.createElement('a');
        parsedURL.href = url;
        var pathname = parsedURL.pathname
        if(url.indexOf('?') > -1){
            pathname += '?'+url.split('?')[1]
        }
        monitorEditorWindow.find('[name="protocol"]').val(protocol).change()
        if(isRTSP){
            monitorEditorWindow.find('[detail="rtsp_transport"]').val('tcp').change()
            monitorEditorWindow.find('[detail="aduration"]').val(1000000).change()
            monitorEditorWindow.find('[detail="probesize"]').val(1000000).change()
        }
        monitorEditorWindow.find('[detail="muser"]').val(parsedURL.username).change()
        monitorEditorWindow.find('[detail="mpass"]').val(parsedURL.password).change()
        monitorEditorWindow.find('[name="host"]').val(parsedURL.hostname).change()
        monitorEditorWindow.find('[name="port"]').val(parsedURL.port).change()
        monitorEditorWindow.find('[name="path"]').val(pathname).change()
        delete(parsedURL)
    }
})
editorForm.submit(function(e){
    function setSubmitButton(text,icon,toggle){
        var submitButtons = editorForm.find('[type="submit"]').prop('disabled',toggle)
        submitButtons.html(`<i class="fa fa-${icon}"></i> ${text}`)
    }
    e.preventDefault();
    saveMonitorSettingsForm(editorForm)
    return false;
});
//////////////////
//Input Map (Feed)
var mapPlacementInit = function(){
    $('.input-map').each(function(n,v){
        var _this = $(this)
        _this.find('.place').text(n+1)
    })
}
var monitorSectionInputMapsave = function(){
    var mapContainers = monitorEditorWindow.find('[input-mapping]');
    var stringForSave = {}
    mapContainers.each(function(q,t){
        var mapRowElement = $(t).find('.map-row');
        var mapRow = []
        mapRowElement.each(function(n,v){
            var map={}
            $.each($(v).find('[map-input]'),function(m,b){
                map[$(b).attr('map-input')]=$(b).val()
            });
            mapRow.push(map)
        });
        stringForSave[$(t).attr('input-mapping')] = mapRow;
    });
    return stringForSave
}
monitorSectionInputMaps.on('click','.delete',function(){
    $(this).parents('.input-map').remove()
    var inputs = $('[map-detail]')
    if(inputs.length===0){
        monitorEditorWindow.find('[detail="input_maps"]').val('[]').change()
        showInputMappingFields(false)
    }else{
        inputs.first().change()
        showInputMappingFields()
    }
    mapPlacementInit()
})
monitorEditorWindow.on('change','[map-detail]',function(){
    var el = monitorSectionInputMaps.find('.input-map')
    var selectedMaps = []
    el.each(function(n,v){
        var map={}
        $.each($(v).find('[map-detail]'),function(m,b){
            map[$(b).attr('map-detail')]=$(b).val()
        });
        selectedMaps.push(map)
    });
    monitorEditorWindow.find('[detail="input_maps"]').val(JSON.stringify(selectedMaps)).change()
})
monitorEditorWindow.on('click','[input-mapping] .add_map_row',function(){
    drawInputMapSelectorHtml({},$(this).parents('[input-mapping]').find('.choices'))
})
monitorEditorWindow.on('click','[input-mapping] .delete_map_row',function(){
    $(this).parents('.map-row').remove()
})
//////////////////
//Stream Channels
var monitorStreamChannelsave = function(){
    var el = monitorStreamChannels.find('.stream-channel')
    var selectedChannels = []
    el.each(function(n,v){
        var channel={}
        $.each($(v).find('[channel-detail]'),function(m,b){
            channel[$(b).attr('channel-detail')]=$(b).val()
        });
        selectedChannels.push(channel)
    });
    monitorEditorWindow.find('[detail="stream_channels"]').val(JSON.stringify(selectedChannels)).change()
}
var channelPlacementInit = function(){
    $('.stream-channel').each(function(n,v){
        var _this = $(this)
        _this.attr('stream-channel',n)
        _this.find('.place').text(n)
        _this.find('[input-mapping]').attr('input-mapping','stream_channel-'+n)
    })
}
var getSubStreamChannelFields = function(){
    var selectedChannels = {
        input: getPseudoFields('detail-substream-input'),
        output: getPseudoFields('detail-substream-output')
    }
    return selectedChannels
}
var getPseudoFields = function(fieldKey,parent){
    parent = parent || monitorEditorWindow
    fieldKey = fieldKey || 'detail-substream-input'
    var fields = {}
    var fieldsAssociated = parent.find(`[${fieldKey}]`)
    $.each(fieldsAssociated,function(m,b){
        var el = $(b);
        var paramKey = el.attr(fieldKey)
        var value = el.val()
        fields[paramKey] = value
    });
    return fields
}
var buildMonitorURL = function(){
    var user = monitorEditorWindow.find('[detail="muser"]').val();
    var pass = monitorEditorWindow.find('[detail="mpass"]').val();
    var host = monitorEditorWindow.find('[name="host"]').val();
    var protocol = monitorEditorWindow.find('[name="protocol"]').val();
    var port = monitorEditorWindow.find('[name="port"]').val();
    var path = monitorEditorWindow.find('[name="path"]').val();
    var type = monitorEditorWindow.find('[name="type"]').val();
    if(type === 'local'){
        url = path;
    }else{
        if(host.indexOf('@') === -1 && user !== ''){
            host = user + ':' + pass + '@' + host;
        }
        url = compileConnectUrl({
            user: user,
            pass: pass,
            host: host,
            protocol: protocol,
            port: port,
            path: encodeURI(path),
            type: type,
        });
    }
    return url
}
var showInputMappingFields = function(showMaps){
    var el = $('[input-mapping],.input-mapping')
    if(showMaps === undefined)showMaps = true
    if(showMaps){
        el.show()
    }else{
        el.hide()
    }
    setFieldVisibility(editorForm)
    drawMonitorSettingsSubMenu()
}

monitorStreamChannels.on('click','.delete',function(){
    $(this).parents('.stream-channel').remove()
    monitorStreamChannelsave()
    channelPlacementInit()
})
monitorEditorWindow.on('change','[channel-detail]',function(){
    monitorStreamChannelsave()
})
monitorEditorWindow.find('.probe-monitor-settings').click(function(){
    $.pB.submit(buildMonitorURL())
})
monitorEditorWindow.find('.add-input-to-monitor-settings').click(function(e){
    showInputMappingFields()
    drawInputMapHtml()
});
monitorEditorWindow.find('.add-channel-to-monitor-settings').click(function(e){
    drawStreamChannelHtml()
});
monitorEditorWindow.find('.save_config').click(function(){
    saveFormCurrentState(editorForm)
})

    function onMonitorEdit(d){
        var monitorId = d.mid || d.id
        var newMonitorData = d.mon
        var loadedMonitor = loadedMonitors[monitorId]
        clearMonitorTimers(monitorId)
        var montageElement = $('#monitor_live_' + monitorId);
        montageElement.find('.stream-detected-object').remove()
        var watchOnInfo = dashboardOptions()['watch_on'] || {};
        if(newMonitorData.details.cords instanceof Object){
            newMonitorData.details.cords = JSON.stringify(newMonitorData.details.cords)
        }
        newMonitorData.details = JSON.stringify(newMonitorData.details);
        if(!loadedMonitor){
            loadedMonitors[monitorId] = {}
            loadedMonitor = loadedMonitors[monitorId]
        }
        loadedMonitor.previousStreamType = newMonitorData.details.stream_type
        $.each(newMonitorData,function(n,v){
            loadedMonitor[n] = n === 'details' ? safeJsonParse(v) : v
        })
        if(d.new === true){
            drawMonitorIconToMenu(newMonitorData)
        }
        switch(newMonitorData.mode){
            case'start':case'record':
                if(watchOnInfo[newMonitorData.ke] && watchOnInfo[newMonitorData.ke][newMonitorData.mid] === 1){
                    mainSocket.f({
                        f: 'monitor',
                        ff: 'watch_on',
                        id: monitorId
                    })
                }
            break;
        }
        setCosmeticMonitorInfo(newMonitorData)
        drawMonitorGroupList()
        if(!d.silenceNote){
            new PNotify({
                title: 'Monitor Saved',
                text: '<b>'+newMonitorData.name+'</b> <small>'+newMonitorData.mid+'</small> has been saved.',
                type: 'success'
            })
        }
    }
    function clearMonitorTimers(monitorId){
        var theMonitor = loadedMonitors[monitorId]
        if(theMonitor){
            clearTimeout(theMonitor._signal);
            clearInterval(theMonitor.hlsGarbageCollectorTimer)
            clearTimeout(theMonitor.jpegInterval);
            clearInterval(theMonitor.signal);
            clearInterval(theMonitor.m3uCheck);
            if(theMonitor.Base64 && theMonitor.Base64.connected){
                theMonitor.Base64.disconnect()
            }
            if(theMonitor.Poseidon){
                theMonitor.Poseidon.stop()
            }
        }
    }
    function resetMonitorEditor(){
        $.confirm.create({
            title: lang.wannaReset,
            body: lang.undoAllUnsaveChanges,
            clickOptions: {
                title: lang['Reset'],
                class:'btn-danger'
            },
            clickCallback: function(){
                openMonitorEditorPage()
            }
        })
    }

    window.writeToMonitorSettingsWindow = function(monitorValues){
        $.each(monitorValues,function(key,value){
            if(key === `details`){
                $.each(value,function(dkey,dvalue){
                    monitorEditorWindow.find(`[detail="${dkey}"]`).val(dvalue).change()
                })
            }else{
                monitorEditorWindow.find(`[name="${key}"]`).val(value).change()
            }
        })
    }
    monitorsList.change(function(){
        var monitorId = monitorsList.val()
        openMonitorEditorPage(monitorId ? monitorId : null)
    });
    tagsInput.on('itemAdded', function(event) {
        drawMonitorGroupList()
        loadMonitorGroupTriggerList(monitorEditorSelectedMonitor,triggerTagsInput)
    });
    triggerTagsInput.on('itemAdded', function(event) {
        var listOftags = getListOfTagsFromMonitors()
        var newTag = event.item
        if(!listOftags[newTag]){
            new PNotify({
                title: lang.tagsCannotAddText,
                text: lang.tagsTriggerCannotAddText,
                type: 'warning'
            })
            triggerTagsInput.tagsinput('remove', newTag);
        }
    });
    $('body')
    .on('click','.reset-monitor-settings-form',function(){
        resetMonitorEditor()
    })
    .on('click','.import-into-monitor-settings-window',function(){
        launchImportMonitorWindow(function(monitor){
            var monitorConfig = null
            if(monitor.monitor){
                mergeZoneMinderZonesIntoMonitors(monitor)
                monitorConfig = importZoneMinderMonitor(monitor.monitor.Monitor)
            }else
            //zoneminder multiple monitors
            if(monitor.monitors){
                mergeZoneMinderZonesIntoMonitors(monitor)
                monitorConfig = importZoneMinderMonitor(monitor.monitors[0].Monitor)
            }else{
                if(monitor[0] && monitor.mid){
                    monitorConfig = monitor[0];
                }else if(monitor.mid){
                    monitorConfig = monitor;
                }
            }
            if(monitorConfig){
                importIntoMonitorEditor(monitorConfig)
            }

        })
    })
    .on('click','.delete-monitor-in-settings-window',function(){
        var validation = getMonitorEditFormFields()
        var monitorConfig = validation.monitorConfig
        if(loadedMonitors[monitorConfig.mid]){
            deleteMonitors([monitorConfig],function(){
                openMonitorEditorPage()
                goBackOneTab()
            })
        }else{
            resetMonitorEditor()
        }
    })
    .on('click','.export-from-monitor-settings-window',function(){
        var validation = getMonitorEditFormFields()
        var monitorConfig = validation.monitorConfig
        monitorConfig.details = safeJsonParse(monitorConfig.details)
        downloadJSON(monitorConfig,`${monitorConfig.name}_${monitorConfig.mid}_${formattedTime(new Date(),true)}.json`)
    })
    .on('click','.open-monitor-settings',function(){
        var monitorId
        var thisEl = $(this)
        var doNew = thisEl.attr('do-new')
        var monitorId = thisEl.attr('data-mid')
        if(doNew !== 'true' && !monitorId){
            var el = thisEl.parents('[data-mid]')
            monitorId = el.attr('data-mid')
        }
        console.log(monitorId)
        openMonitorEditorPage(doNew === 'true' ? null : monitorId)
    });
    monitorEditorWindow.find('.probe_config').click(function(){
        $.pB.submit(buildMonitorURL(),true)
    });
    onWebSocketEvent(function (d){
        //     new PNotify({
        //         title: lang['Settings Changed'],
        //         text: lang.SettingsChangedText,
        //         type: 'success'
        //     })
        switch(d.f){
            case'monitor_status':
                loadedMonitors[d.id].code = parseInt(`${d.code}`)
                loadedMonitors[d.id].status = `${d.status}`
                $('[data-mid="'+d.id+'"] .monitor_status').html(monitorStatusCodes[d.code] || d.code || d.status);
            break;
            case'monitor_delete':
                $('[data-mid="'+d.mid+'"]:not(#tab-monitorSettings)').remove();
                clearMonitorTimers(d.mid)
                delete(loadedMonitors[d.mid]);
                setMonitorCountOnUI()
            break;
            case'monitor_edit':
                setMonitorCountOnUI()
                onMonitorEdit(d)
            break;
            case'detector_plugged':
                addDetectorPlugin(d.plug,d)
            break;
            case'detector_unplugged':
                removeDetectorPlugin(d.plug)
            break;
        }
    })
    function onTabMove(){
        var theSelected = `${monitorsList.val() || ''}`
        drawMonitorListToSelector(monitorsList.find('optgroup'),false,'host')
        monitorsList.val(theSelected)
        checkToOpenSideMenu()
    }
    addOnTabAway('monitorSettings', function(){
        checkToCloseSideMenu()
    })
    addOnTabOpen('monitorSettings', function () {
        setFieldVisibility(editorForm)
        drawMonitorSettingsSubMenu()
        onTabMove()
    })
    addOnTabReopen('monitorSettings', function () {
        setFieldVisibility(editorForm)
        drawMonitorSettingsSubMenu()
        onTabMove()
    })
    onDetectorPluginChange(function(){
        setFieldVisibility(editorForm)
        drawMonitorSettingsSubMenu()
    })
    window.importIntoMonitorEditor = importIntoMonitorEditor
    attachEditorFormFieldChangeEvents(monitorEditorWindow,editorForm)
})
