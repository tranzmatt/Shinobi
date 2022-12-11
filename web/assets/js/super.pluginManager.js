$(document).ready(function(){
    var loadedModules = {}
    var listElement = $('#pluginManagerList')
    var quickSelect = $('#pluginQuickSelect')
    var pluginDownloadForm = $('#downloadNewPlugin')
    var getModules = function(callback) {
        $.get(superApiPrefix + $user.sessionKey + '/plugins/list',callback)
    }
    var loadedBlocks = {}
    var drawModuleBlock = function(module){
        var humanName = module.properties.name ? module.properties.name : module.name
        if(listElement.find(`[package-name="${module.name}"]`).length > 0){
            var existingElement = listElement.find('[package-name="${module.name}"]')
            existingElement.find('.title').text(humanName)
            existingElement.find('[plugin-manager-action="status"]').text(!module.config.enabled ? lang.Enable : lang.Disable)
        }else{
            listElement.prepend(`
                    <div class="card bg-dark text-white mb-3" package-name="${module.name}">
                        <div class="card-body pb-3">
                            <div><h4 class="title my-0">${humanName}</h4></div>
                            <div clas="mb-2"><small>${module.name}</small></div>
                            <div class="pb-2"><b>${lang['Time Created']} :</b> ${module.created}</div>
                            <div class="pb-2"><b>${lang['Last Modified']} :</b> ${module.lastModified}</div>
                            <div class="mb-2">
                                ${module.hasInstaller ? `
                                    <a class="btn btn-sm btn-info" plugin-manager-action="install">${lang['Run Installer']}</a>
                                    <a class="btn btn-sm btn-danger" style="display:none" plugin-manager-action="cancelInstall">${lang['Stop']}</a>
                                ` : ''}
                                ${module.hasTester ? `
                                    <a class="btn btn-sm btn-default" plugin-manager-action="test">${lang['Test']}</a>
                                    <a class="btn btn-sm btn-danger" style="display:none" plugin-manager-action="cancelTest">${lang['Stop']}</a>
                                ` : ''}
                                <a class="btn btn-sm btn-default" plugin-manager-action="status">${!module.config.enabled ? lang.Enable : lang.Disable}</a>
                                <a class="btn btn-sm btn-danger" plugin-manager-action="delete">${lang.Delete}</a>
                                <a class="btn btn-sm btn-warning" plugin-manager-action="editConfig">${lang[`Edit Configuration`]}</a>
                            </div>
                            <div class="pl-2 pr-2">
                                <div class="install-output row">
                                    <div class="col-md-6 pr-2"><pre class="install-output-stdout text-white mb-0"></pre></div>
                                    <div class="col-md-6 pl-2"><pre class="install-output-stderr text-white mb-0"></pre></div>
                                </div>
                                <div class="command-installer row" style="display:none">
                                    <div class="col-md-6">
                                        <button type="button" class="btn btn-sm btn-success btn-block" plugin-manager-action="command" command="y">${lang.Yes}</button>
                                    </div>
                                    <div class="col-md-6">
                                        <button type="button" class="btn btn-sm btn-danger btn-block" plugin-manager-action="command" command="N">${lang.No}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`)
            var newBlock = $(`.card[package-name="${module.name}"]`)
            loadedBlocks[module.name] = {
                block: newBlock,
                stdout: newBlock.find('.install-output-stdout'),
                stderr: newBlock.find('.install-output-stderr'),
            }
        }
    }
    var downloadModule = function(url,packageRoot,callback){
        $.confirm.create({
            title: 'Module Download',
            body: `Do you want to download the module from <b>${url}</b>? `,
            clickOptions: {
                class: 'btn-success',
                title: lang.Download,
            },
            clickCallback: function(){
                $.post(superApiPrefix + $user.sessionKey + '/plugins/download',{
                    downloadUrl: url,
                    packageRoot: packageRoot,
                },callback)
            }
        })
    }
    var installModule = function(packageName,callback){
        $.confirm.create({
            title: 'Install Module',
            body: `Do you want to install the module ${packageName}?`,
            clickOptions: {
                class: 'btn-success',
                title: lang.Install,
            },
            clickCallback: function(){
                loadedBlocks[packageName].stdout.empty()
                loadedBlocks[packageName].stderr.empty()
                $.post(superApiPrefix + $user.sessionKey + '/plugins/install',{
                    packageName: packageName,
                },callback)
            }
        })
    }
    var testModule = function(packageName,callback){
        $.confirm.create({
            title: 'Test Module',
            body: `Do you want to test the module ${packageName}?`,
            clickOptions: {
                class: 'btn-success',
                title: lang.Test,
            },
            clickCallback: function(){
                loadedBlocks[packageName].stdout.empty()
                loadedBlocks[packageName].stderr.empty()
                $.post(superApiPrefix + $user.sessionKey + '/plugins/test',{
                    packageName: packageName,
                },callback)
            }
        })
    }
    var deleteModule = function(packageName,callback){
        $.confirm.create({
            title: 'Delete Module',
            body: `Do you want to delete the module ${packageName}?`,
            clickOptions: {
                class: 'btn-danger',
                title: lang.Delete,
            },
            clickCallback: function(){
                $.post(superApiPrefix + $user.sessionKey + '/plugins/delete',{
                    packageName: packageName,
                },callback)
            }
        })
    }
    var setModuleStatus = function(packageName,status,callback){
        $.post(superApiPrefix + $user.sessionKey + '/plugins/status',{
            status: status,
            packageName: packageName,
        },callback)
    }
    var sendInstallerCommand = function(packageName,command,callback){
        $.post(superApiPrefix + $user.sessionKey + '/plugins/command',{
            command: command,
            packageName: packageName,
        },callback)
    }
    var getPluginBlock = function(packageName){
        return loadedBlocks[packageName].block
    }
    var toggleUsabilityOfYesAndNoButtons = function(packageName,enabled){
        getPluginBlock(packageName).find('.command-installer')[!enabled ? 'hide' : 'show']()
    }
    var toggleCardButtons = function(card,buttons){
        $.each(buttons,function(n,button){
            card.find(`[plugin-manager-action="${button.action}"]`)[button.show ? 'show' : 'hide']()
        })
    }
    function appendLoggerData(text,outputEl){
        outputEl.append(`<div class="line">${text}</div>`)
        setTimeout(function(){
            var objDiv = outputEl[0]
            objDiv.scrollTop = objDiv.scrollHeight;
        },100)
    }
    $('body').on(`click`,`[plugin-manager-action]`,function(e){
        e.preventDefault()
        var el = $(this)
        var action = el.attr('plugin-manager-action')
        var card = el.parents('[package-name]')
        var packageName = card.attr('package-name')
        switch(action){
            case'install':
                installModule(packageName,function(data){
                    if(data.ok){
                        toggleCardButtons(card,[
                            {
                                action: 'install',
                                show: false,
                            },
                            {
                                action: 'test',
                                show: false,
                            },
                            {
                                action: 'cancelInstall',
                                show: true,
                            },
                            {
                                action: 'delete',
                                show: false,
                            },
                            {
                                action: 'status',
                                show: false,
                            },
                        ])
                    }
                })
            break;
            case'test':
                testModule(packageName,function(data){
                    if(data.ok){
                        toggleCardButtons(card,[
                            {
                                action: 'install',
                                show: false,
                            },
                            {
                                action: 'test',
                                show: false,
                            },
                            {
                                action: 'cancelInstall',
                                show: false,
                            },
                            {
                                action: 'cancelTest',
                                show: true,
                            },
                            {
                                action: 'delete',
                                show: false,
                            },
                            {
                                action: 'status',
                                show: false,
                            },
                        ])
                    }
                })
            break;
            case'cancelInstall':
                $.post(superApiPrefix + $user.sessionKey + '/plugins/install',{
                    packageName: packageName,
                    cancelInstall: 'true'
                },function(data){
                    if(data.ok){
                        toggleCardButtons(card,[
                            {
                                action: 'install',
                                show: true,
                            },
                            {
                                action: 'test',
                                show: true,
                            },
                            {
                                action: 'cancelInstall',
                                show: false,
                            },
                            {
                                action: 'delete',
                                show: true,
                            },
                            {
                                action: 'status',
                                show: true,
                            },
                        ])
                    }
                })
                toggleUsabilityOfYesAndNoButtons(packageName,false)
            break;
            case'cancelTest':
                $.post(superApiPrefix + $user.sessionKey + '/plugins/test',{
                    packageName: packageName,
                    cancelInstall: 'true'
                },function(data){
                    if(data.ok){
                        toggleCardButtons(card,[
                            {
                                action: 'install',
                                show: true,
                            },
                            {
                                action: 'test',
                                show: true,
                            },
                            {
                                action: 'cancelInstall',
                                show: false,
                            },
                            {
                                action: 'cancelTest',
                                show: false,
                            },
                            {
                                action: 'delete',
                                show: true,
                            },
                            {
                                action: 'status',
                                show: true,
                            },
                        ])
                    }
                })
                toggleUsabilityOfYesAndNoButtons(packageName,false)
            break;
            case'status':
                var currentStatus = !!loadedModules[packageName].config.enabled
                var newStatus = !currentStatus
                setModuleStatus(packageName,newStatus,function(data){
                    if(data.ok){
                        loadedModules[packageName].config.enabled = newStatus
                        el.text(currentStatus ? lang.Enable : lang.Disable)
                    }
                })
            break;
            case'delete':
                deleteModule(packageName,function(data){
                    if(data.ok){
                        card.remove()
                    }
                })
            break;
            case'command':
                var command = el.attr('command')
                sendInstallerCommand(packageName,command,function(data){
                    if(data.ok){
                        toggleUsabilityOfYesAndNoButtons(packageName,false)
                    }
                })
            break;
            case'editConfig':
                $.get(superApiPrefix + $user.sessionKey + '/plugins/configuration?packageName=' + packageName,function(data){
                    $.confirm.create({
                        title: lang[`Edit Configuration`],
                        body: `<textarea id="pluginConfigEditContents" class="form-control" style="height:400px;font-family: monospace;border:1px solid #eee; border-radius: 15px;padding: 10px;">${JSON.stringify(data.config,null,3) || {}}</textarea>`,
                        clickOptions: {
                            class: 'btn-success',
                            title: lang.Save,
                        },
                        clickCallback: function(){
                            var newPluginConfigStringed = $('#pluginConfigEditContents').val()
                            $.post(superApiPrefix + $user.sessionKey + '/plugins/configuration/update',{
                                packageName: packageName,
                                config: newPluginConfigStringed,
                            },function(data){
                                console.log(data)
                            })
                        }
                    })
                })
            break;
        }
    })
    pluginDownloadForm.submit(function(e){
        e.preventDefault();
        var el = $(this)
        var form = el.serializeObject()
        downloadModule(form.downloadUrl,form.packageRoot,function(data){
            console.log(data)
            if(data.ok){
                var theModule = data.newModule
                theModule.config.enabled = false
                drawModuleBlock(theModule)
                if(theModule.installerRunning){
                    toggleCardButtons(card,[
                        {
                            action: 'install',
                            show: false,
                        },
                        {
                            action: 'cancelInstall',
                            show: true,
                        },
                        {
                            action: 'delete',
                            show: false,
                        },
                        {
                            action: 'status',
                            show: false,
                        },
                    ])
                }
            }
        })
        return false
    })
    $('#pluginQuickSelectExec').click(function(){
        var currentVal = quickSelect.val()
        var valParts = currentVal.split('.zip,')
        var packageUrl = `${valParts[0]}.zip`
        var packageRoot = valParts[1]
        pluginDownloadForm.find(`[name="downloadUrl"]`).val(packageUrl)
        pluginDownloadForm.find(`[name="packageRoot"]`).val(packageRoot)
        pluginDownloadForm.submit()
    })
    setTimeout(function(){
        getModules(function(data){
            loadedModules = data.modules
            console.log(loadedModules)
            $.each(data.modules,function(n,module){
                drawModuleBlock(module)
            })
        })
    },2000)
    $.ccio.ws.on('f',function(data){
        switch(data.f){
            case'plugin-info':
                var name = data.module
                switch(data.process){
                    case'test-stdout':
                    case'install-stdout':
                        appendLoggerData(data.data,loadedBlocks[name].stdout)
                        if(data.data.indexOf('(y)es or (N)o') > -1){
                            toggleUsabilityOfYesAndNoButtons(name,true)
                        }else if(data.data === '#END_PROCESS'){
                            var isTest = data.process === 'test-stdout'
                            var card = $(`[package-name="${name}"]`)
                            toggleCardButtons(card,[
                                {
                                    action: 'install',
                                    show: true,
                                },
                                {
                                    action: 'test',
                                    show: true,
                                },
                                {
                                    action: 'cancelInstall',
                                    show: false,
                                },
                                {
                                    action: 'cancelTest',
                                    show: false,
                                },
                                {
                                    action: 'delete',
                                    show: true,
                                },
                                {
                                    action: 'status',
                                    show: true,
                                },
                            ])
                        }
                    break;
                    case'test-stderr':
                    case'install-stderr':
                        appendLoggerData(data.data,loadedBlocks[name].stderr)
                    break;
                }
            break;
        }
    })
})
