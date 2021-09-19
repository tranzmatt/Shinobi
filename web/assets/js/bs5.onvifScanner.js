$(document).ready(function(e){
    //onvif probe
    var currentUsername = ''
    var currentPassword = ''
    var loadedResults = {}
    var foundMonitors = {}
    var monitorEditorWindow = $('#tab-monitorSettings')
    var onvifScannerWindow = $('#tab-onvifScanner')
    var onvifScannerResultPane = onvifScannerWindow.find('.onvif_result')
    var scanForm = onvifScannerWindow.find('form');
    var outputBlock = onvifScannerWindow.find('.onvif_result');
    var sideMenuList = $(`#side-menu-link-onvifScanner  ul`)
    var checkTimeout;
    function addCredentialsToUri(uri,username,password){
        let newUri = `${uri}`
        const uriParts = newUri.split('://')
        uriParts[1] = `${username}:${password}@${uriParts[1]}`
        newUri = uriParts.join('://')
        return newUri
    }
    function drawFoundCamerasSubMenu(){
        var allFound = []
        Object.keys(loadedResults).forEach(function(tempID){
            var item = loadedResults[tempID]
            allFound.push({
                attributes: `href="#onvif-result-${tempID}" scrollToParent="#tab-onvifScanner"`,
                class: `scrollTo`,
                color: 'blue',
                label: item.host + ':' + item.details.onvif_port,
            })
        })
        var html = buildSubMenuItems(allFound)
        sideMenuList.html(html)
    }
    var setAsLoading = function(appearance){
        if(appearance){
            onvifScannerWindow.find('._loading').show()
            onvifScannerWindow.find('[type="submit"]').prop('disabled',true)
        }else{
            onvifScannerWindow.find('._loading').hide()
            onvifScannerWindow.find('[type="submit"]').prop('disabled',false)
        }
    }
    var drawProbeResult = function(options){
        var tempID = generateId()
        foundMonitors[tempID] = Object.assign({},options);
        onvifScannerWindow.find('._notfound').remove()
        setAsLoading(false)
        var info = options.error ? options.error : options.info ? jsonToHtmlBlock(options.info) : ''
        var streamUrl = options.error ? '' : 'No Stream URL Found'
        var launchWebPage = `target="_blank" href="http${options.port == 443 ? 's' : ''}://${options.ip}:${options.port}"`
        if(options.uri){
            streamUrl = options.uri
        }
        onvifScannerResultPane[options.error ? 'append' : 'prepend'](`
            <div class="col-md-4 mb-3" onvif_row="${tempID}" id="onvif-result-${tempID}">
                <div style="display:block" ${options.error ? launchWebPage : ''} class="card shadow btn-default ${options.error ? '' : 'copy'}">
                    <div class="preview-image card-header" style="background-image:url(${options.snapShot ? 'data:image/png;base64,' + options.snapShot : placeholder.getData(placeholder.plcimg({text: ' ', fsize: 25, bgcolor:'#1f80f9'}))})"></div>
                    <div class="card-body" ${options.error ? '' : 'style="min-height:190px"'}>
                        <div>${info}</div>
                        <div class="url">${streamUrl}</div>
                    </div>
                    <div class="card-footer">${options.ip}:${options.port}</div>
                </div>
            </div>
        `)
        if(!options.error){
            var theLocation = getLocationFromUri(options.uri)
            var pathLocation = theLocation.location
            loadedResults[tempID] = {
                mid: tempID + `${options.port}`,
                host: pathLocation.hostname,
                port: pathLocation.port,
                path: pathLocation.pathname,
                protocol: theLocation.protocol,
                details: {
                    auto_host: addCredentialsToUri(streamUrl,currentUsername,currentPassword),
                    muser: currentUsername,
                    mpass: currentPassword,
                    is_onvif: '1',
                    onvif_port: options.port,
                },
            }
            if(options.isPTZ){
                loadedResults[tempID].details = Object.assign(loadedResults[tempID].details,{
                    control: '1',
                    control_url_method: 'ONVIF',
                    control_stop: '1',
                })
            }
        }
        // console.log(loadedResults[tempID])
        drawFoundCamerasSubMenu()
    }
    var filterOutMonitorsThatAreAlreadyAdded = function(listOfCameras,callback){
        $.get(getApiPrefix(`monitor`),function(monitors){
            var monitorsNotExisting = []
            $.each(listOfCameras,function(n,camera){
                var matches = false
                $.each(monitors,function(m,monitor){
                    if(monitor.host === camera.host){
                        matches = true
                    }
                })
                if(!matches){
                    monitorsNotExisting.push(camera)
                }
            })
            callback(monitorsNotExisting)
        })
    }
    var getLocationFromUri = function(uri){
        var newString = uri.split('://')
        var protocol = `${newString[0]}`
        newString[0] = 'http'
        newString = newString.join('://')
        var uriLocation = new URL(newString)
        // uriLocation.protocol = protocol
        return {
            location: uriLocation,
            protocol: protocol
        }
    }
    var postMonitor = function(monitorToPost){
        var newMon = mergeDeep(generateDefaultMonitorSettings(),monitorToPost)
        $.post(getApiPrefix(`configureMonitor`) + '/' + monitorToPost.mid,{data:JSON.stringify(newMon,null,3)},function(d){
            debugLog(d)
        })
    }
    function loadLocalOptions(){
        var currentOptions = dashboardOptions()
        $.each(['ip','port','user'],function(n,key){
            onvifScannerWindow.find(`[name="${key}"]`).change(function(e){
                var value = $(this).val()
                dashboardOptions(`onvif_probe_${key}`,value,{x: value ? null : 0})
            })
            if(currentOptions[`onvif_probe_${key}`]){
                onvifScannerWindow.find(`[name="${key}"]`).val(currentOptions[`onvif_probe_${key}`])
            }
        })
    }
    scanForm.submit(function(e){
        e.preventDefault();
        currentUsername = onvifScannerWindow.find('[name="user"]').val()
        currentPassword = onvifScannerWindow.find('[name="pass"]').val()
        loadedResults = {}
        foundMonitors = {}
        var el = $(this)
        var form = el.serializeObject();
        outputBlock.empty();
        setAsLoading(true)
        mainSocket.f({
            f: 'onvif',
            ip: form.ip,
            port: form.port,
            user: form.user,
            pass: form.pass
        });
        clearTimeout(checkTimeout)
        checkTimeout = setTimeout(function(){
            if(outputBlock.find('.card').length === 0){
                setAsLoading(false)
                outputBlock.append(`<td style="padding: 10px;" class="text-center _notfound text-white epic-text">${lang.sorryNothingWasFound}</td>`)
            }
        },5000)
        return false;
    });
    onvifScannerWindow.on('click','.copy',function(){
        openMonitorEditorPage()
        el = $(this).parents('[onvif_row]');
        var id = el.attr('onvif_row');
        var onvifRecord = loadedResults[id];
        var streamURL = onvifRecord.details.auto_host
        writeToMonitorSettingsWindow(onvifRecord)
    })
    onvifScannerWindow.on('click','.add-all',function(){
        filterOutMonitorsThatAreAlreadyAdded(loadedResults,function(importableCameras){
            $.each(importableCameras,function(n,camera){
                // console.log(camera)
                postMonitor(camera)
            })
        })
    })
    loadLocalOptions()
    mainSocket.on('f',function(d){
        switch(d.f){
            case'onvif':
                drawProbeResult(d)
            break;
        }
    })
})
