$(document).ready(function(e){
    var monitorEditorWindow = $('#tab-monitorSettingsAudioOnly')
    var monitorsList = monitorEditorWindow.find('.monitors_list')
    var editorForm = monitorEditorWindow.find('form')
    var tagsInput = monitorEditorWindow.find('[name="tags"]')
    var triggerTagsInput = monitorEditorWindow.find('[detail=det_trigger_tags]')
    var fieldsLoaded = {}
    var sections = {}
    function drawMonitorSettingsSubMenu(){
        drawSubMenuItems('monitorSettings',definitions['Monitor Settings for Audio Only'])
    }
    //parse "Automatic" field in "Input" Section
    monitorEditorWindow.on('change','.auto_host_fill input,.auto_host_fill select',function(e){
        var theSwitch = monitorEditorWindow.find('[detail="auto_host_enable"]').val()
        if(!theSwitch||theSwitch===''){
            theSwitch='1'
        }
        if(theSwitch==='1'){
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
    monitorEditorWindow.find('.save_config').click(function(){
        downloadFormCurrentState(editorForm)
    });
    editorForm.on('change','[selector]',function(){
        drawMonitorSettingsSubMenu()
    });
    function onTabMove(){
        var theSelected = `${monitorsList.val() || ''}`
        drawMonitorListToSelector(monitorsList,false,'host')
        monitorsList.val(theSelected)
        checkToOpenSideMenu()
    }
    addOnTabAway('monitorSettingsAudioOnly', function(){
        checkToCloseSideMenu()
    })
    addOnTabOpen('monitorSettingsAudioOnly', function () {
        setFieldVisibility(editorForm)
        drawMonitorSettingsSubMenu()
        onTabMove()
    })
    addOnTabReopen('monitorSettingsAudioOnly', function () {
        setFieldVisibility(editorForm)
        drawMonitorSettingsSubMenu()
        onTabMove()
    })
    attachEditorFormFieldChangeEvents(editorForm)
})
