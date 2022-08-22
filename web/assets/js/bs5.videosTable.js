$(document).ready(function(e){
    var theEnclosure = $('#tab-videosTableView')
    var monitorsList = theEnclosure.find('.monitors_list')
    var dateSelector = theEnclosure.find('.date_selector')
    var videosTableDrawArea = $('#videosTable_draw_area')
    var videosTablePreviewArea = $('#videosTable_preview_area')
    var objectTagSearchField = $('#videosTable_tag_search')
    var cloudVideoCheckSwitch = $('#videosTable_cloudVideos')
    var sideLinkListBox = $('#side-menu-link-videosTableView ul')
    var loadedVideosTable = [];
    var redrawTimeout;
    var frameUrlCache = {}
    var frameUrlCacheTimeouts = {}
    async function getSnapshotFromVideoTimeFrame(monitorId,startDate,endDate){
        const frameUrlCacheId = `${monitorId}${startDate}${endDate}`
        if(frameUrlCache[frameUrlCacheId]){
            return frameUrlCache[frameUrlCacheId]
        }else{
            const frame = (await getTimelapseFrames(monitorId,startDate,endDate,1))[0]
            const href = frame && frame.href ? frame.href : ''
            frameUrlCache[frameUrlCacheId] = `${href}`
            frameUrlCacheTimeouts[frameUrlCacheId] = setTimeout(() => {
                delete(frameUrlCache[frameUrlCacheId])
                delete(frameUrlCacheTimeouts[frameUrlCacheId])
            },1000 * 60 * 15)
            return href
        }
    }
    function loadFramesForVideosInView(){
        videosTableDrawArea.find('.video-thumbnail').each(async (n,imgEl) => {
            const el = $(imgEl)
            const monitorId = el.attr('data-mid')
            const startDate = el.attr('data-time')
            const endDate = el.attr('data-end')
            const imgBlock = el.find('.video-thumbnail-img-block')
            const href = await getSnapshotFromVideoTimeFrame(monitorId,startDate,endDate)
            imgBlock.html(`<img class="pop-image cursor-pointer" src="${href}">`)
        })
    }
    function openVideosTableView(monitorId,startDate,endDate){
        drawVideosTableViewElements(monitorId,startDate,endDate)
    }
    function getSelectedTime(asUtc){
        var dateRange = dateSelector.data('daterangepicker')
        var startDate = dateRange.startDate.clone()
        var endDate = dateRange.endDate.clone()
        if(asUtc){
            startDate = startDate.utc()
            endDate = endDate.utc()
        }
        startDate = startDate.format('YYYY-MM-DDTHH:mm:ss')
        endDate = endDate.format('YYYY-MM-DDTHH:mm:ss')
        return {
            startDate: startDate,
            endDate: endDate
        }
    }

    dateSelector.daterangepicker({
        startDate: moment().utc().subtract(2, 'days'),
        endDate: moment().utc(),
        timePicker: true,
        locale: {
            format: 'YYYY/MM/DD hh:mm:ss A'
        }
    }, function(start, end, label) {
        drawVideosTableViewElements()
    })
    monitorsList.change(function(){
        drawVideosTableViewElements()
    })
    objectTagSearchField.change(function(){
        drawVideosTableViewElements()
    })
    cloudVideoCheckSwitch.change(function(){
        drawVideosTableViewElements()
    })
    async function drawVideosTableViewElements(usePreloadedData){
        var dateRange = getSelectedTime(false)
        var searchQuery = objectTagSearchField.val() || null
        var startDate = dateRange.startDate
        var endDate = dateRange.endDate
        var monitorId = monitorsList.val()
        var wantsArchivedVideo = getVideoSetSelected() === 'archive'
        var frameIconsHtml = ''
        if(!usePreloadedData){
            loadedVideosTable = (await getVideos({
                monitorId,
                startDate,
                endDate,
                searchQuery,
                archived: wantsArchivedVideo,
                customVideoSet: wantCloudVideos() ? 'cloudVideos' : null,
            })).videos;
            $.each(loadedVideosTable,function(n,v){
                loadedVideosInMemory[`${monitorId}${v.time}`]
            })
        }
        // for (let i = 0; i < loadedVideosTable.length; i++) {
        //     const file = loadedVideosTable[i]
        //     const frameUrl = await getSnapshotFromVideoTimeFrame(file.mid,file.time,file.end);
        //     file.frameUrl = frameUrl
        // }
        videosTableDrawArea.bootstrapTable('destroy')
        videosTableDrawArea.bootstrapTable({
            onPostBody: loadFramesForVideosInView,
            onPageChange: () => {
                setTimeout(() => {
                    loadFramesForVideosInView()
                },500)
            },
            pagination: true,
            search: true,
            columns: [
                  {
                    field: 'mid',
                    title: '',
                    checkbox: true,
                    formatter: () => {
                        return {
                            checked: false
                        }
                    },
                  },
                  {
                    field: 'image',
                    title: '',
                  },
                  {
                    field: 'Monitor',
                    title: '',
                  },
                  {
                    field: 'time',
                    title: lang['Time Created'],
                  },
                  {
                    field: 'end',
                    title: lang['Ended']
                  },
                  {
                    field: 'objects',
                    title: lang['Objects Found']
                  },
                  {
                    field: 'tags',
                    title: ''
                  },
                  {
                    field: 'size',
                    title: ''
                  },
                  {
                    field: 'buttons',
                    title: ''
                  }
            ],
            data: loadedVideosTable.map((file) => {
                var href = getFullOrigin(true) + file.href
                var loadedMonitor = loadedMonitors[file.mid]
                return {
                    image: `<div class="video-thumbnail" data-mid="${file.mid}" data-ke="${file.ke}" data-time="${file.time}" data-end="${file.end}" data-filename="${file.filename}">
                        <div class="video-thumbnail-img-block">
                        </div>
                        <div class="video-thumbnail-buttons d-flex">
                            <a class="video-thumbnail-button-cell open-snapshot p-3">
                                <i class="fa fa-camera"></i>
                            </a>
                            <a class="video-thumbnail-button-cell preview-video p-3" href="${href}" title="${lang.Play}">
                                <i class="fa fa-play"></i>
                            </a>
                        </div>
                    </div>`,
                    Monitor: loadedMonitor && loadedMonitor.name ? loadedMonitor.name : file.mid,
                    mid: file.mid,
                    time: formattedTime(file.time, 'DD-MM-YYYY hh:mm:ss AA'),
                    end: formattedTime(file.end, 'DD-MM-YYYY hh:mm:ss AA'),
                    tags: `
                        <span class="badge badge-${file.ext ==='webm' ? `primary` : 'danger'}">${file.ext}</span>
                    `,
                    objects: file.objects,
                    size: convertKbToHumanSize(file.size),
                    buttons: `
                    <div class="row-info" data-mid="${file.mid}" data-ke="${file.ke}" data-time="${file.time}" data-filename="${file.filename}">
                        <a class="btn btn-sm btn-primary" href="${href}" download title="${lang.Download}"><i class="fa fa-download"></i></a>
                        <a class="btn btn-sm btn-default open-video" href="${href}" title="${lang.Play}"><i class="fa fa-play"></i></a>
                        ${permissionCheck('video_delete',file.mid) ? `<a class="btn btn-sm btn-danger delete-video" href="${href}" title="${lang.Delete}"><i class="fa fa-trash-o"></i></a>` : ''}
                        ${permissionCheck('video_delete',file.mid) ? `<a class="btn btn-sm btn-warning compress-video" href="${href}" title="${lang.Compress}"><i class="fa fa-compress"></i></a>` : ''}
                        ${permissionCheck('video_delete',file.mid) ? `<a class="btn btn-sm btn-${file.archive === 1 ? `success status-archived` : `default`} archive-video" title="${lang.Archive}"><i class="fa fa-${file.archive === 1 ? `lock` : `unlock-alt`}"></i></a>` : ''}
                    </div>
                    `,
                }
            })
        })
    }
    function drawPreviewVideo(href){
        videosTablePreviewArea.html(`<video class="video_video" style="width:100%" autoplay controls preload loop src="${href}"></video>`)
    }
    function getSelectedRows(){
        var rowsSelected = []
        videosTableDrawArea.find('[name="btSelectItem"]:checked').each(function(n,checkbox){
            var rowInfo = $(checkbox).parents('tr').find('.row-info')
            var monitorId = rowInfo.attr('data-mid')
            var groupKey = rowInfo.attr('data-ke')
            var filename = rowInfo.attr('data-filename')
            rowsSelected.push({
                mid: monitorId,
                ke: groupKey,
                filename: filename,
            })
        })
        return rowsSelected
    }
    function getVideoSetSelected(){
        return cloudVideoCheckSwitch.val()
    }
    function wantCloudVideos(){
        const isChecked = getVideoSetSelected() === 'cloud'
        return isChecked
    }
    function drawCompressedVideoProgressBar(data){
        var videoUrl = buildNewFileLink(data)
        var html = `<li data-mid="${data.mid}" data-ke="${data.mid}" data-name="${data.name}" title="${data.name}">
            <div class="text-white cursor-pointer d-flex flex-row" style="align-items: center;justify-content: center;">
                <span class="dot shadow mr-2 dot-orange"></span>
                <div class="row-status">
                    ${lang.Compressing}...
                </div>
                <div class="flex-grow-1 px-2 pt-1">
                    <div class="progress" style="height:18px">
                        <div class="progress-bar progress-bar-warning" role="progressbar" style="width: ${data.percent}%;">${data.percent}%</div>
                    </div>
                </div>
                <div style="display:none;" class="download-button pr-2">
                    <a class="badge badge-sm badge-default open-video" href="${videoUrl}"><i class="fa fa-play"></i></a>
                </div>
                <div style="display:none;" class="download-button pr-2">
                    <a class="badge badge-sm badge-success" download href="${videoUrl}"><i class="fa fa-download"></i></a>
                </div>
                <div style="display:none;" class="download-button">
                    <a class="badge badge-sm badge-dark remove-row"><i class="fa fa-times"></i></a>
                </div>
            </div>
        </li>`
        sideLinkListBox.append(html)
    }
    function buildNewFileLink(data){
        return apiBaseUrl + '/videos/' + data.ke + '/' + data.mid + '/' + data.name
    }
    function downloadCompressedVideo(data){
        var downloadUrl = buildNewFileLink(data)
        downloadFile(downloadUrl,data.name)
    }
    $('body')
    .on('click','.open-videosTable',function(e){
        e.preventDefault()
        var monitorId = getRowsMonitorId(this)
        openTab(`videosTableView`,{},null,null,null,() => {
            drawMonitorListToSelector(monitorsList,null,null,true)
            monitorsList.val(monitorId)
            drawVideosTableViewElements()
        })
        return false;
    });
    sideLinkListBox
    .on('click','.remove-row',function(){
        var el = $(this).parents('[data-mid]')
        el.remove()
    });
    theEnclosure
    .on('click','.preview-video',function(e){
        e.preventDefault()
        var href = $(this).attr('href')
        drawPreviewVideo(href)
        return false;
    })
    .on('click','.refresh-data',function(e){
        e.preventDefault()
        drawVideosTableViewElements()
        return false;
    })
    .on('click','.open-snapshot',function(e){
        e.preventDefault()
        var href = $(this).parents('.video-thumbnail').find('img').click()
        return false;
    })
    .on('click','.delete-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        if(videos.length === 0)return;
        $.confirm.create({
            title: lang["Delete Videos"],
            body: `${lang.DeleteTheseMsg}`,
            clickOptions: {
                title: '<i class="fa fa-trash-o"></i> ' + lang.Delete,
                class: 'btn-danger btn-sm'
            },
            clickCallback: function(){
                deleteVideos(videos).then(() => {
                    console.log(`Done Deleting Rows!`)
                })
            }
        });
        return false;
    })
    .on('click','.compress-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        if(videos.length === 0)return;
        $.confirm.create({
            title: lang["Compress Videos"],
            body: `${lang.CompressTheseMsg}`,
            clickOptions: {
                title: '<i class="fa fa-compress"></i> ' + lang.Compress,
                class: 'btn-primary btn-sm'
            },
            clickCallback: function(){
                compressVideos(videos).then(() => {
                    console.log(`Done Sending Compression Request!`)
                })
            }
        });
        return false;
    })
    .on('click','.archive-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        if(videos.length === 0)return;
        $.confirm.create({
            title: lang["Archive Videos"],
            body: `${lang.ArchiveTheseMsg}`,
            clickOptions: {
                title: '<i class="fa fa-lock"></i> ' + lang.Archive,
                class: 'btn-primary btn-sm'
            },
            clickCallback: function(){
                archiveVideos(videos).then(() => {
                    console.log(`Done Archiving Rows!`)
                })
            }
        });
        return false;
    })
    .on('click','.download-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        if(videos.length === 0)return;
        $.confirm.create({
            title: lang["Batch Download"],
            body: `${lang.batchDownloadText}`,
            clickOptions: {
                title: '<i class="fa fa-check"></i> ' + lang.Yes,
                class: 'btn-success btn-sm'
            },
            clickCallback: function(){
                downloadVideos(videos)
            }
        });
        return false;
    })
    .on('click','.pop-img',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        if(videos.length === 0)return;
        $.confirm.create({
            title: lang["Batch Download"],
            body: `${lang.batchDownloadText}`,
            clickOptions: {
                title: '<i class="fa fa-check"></i> ' + lang.Yes,
                class: 'btn-success btn-sm'
            },
            clickCallback: function(){
                downloadVideos(videos)
            }
        });
        return false;
    })
    onWebSocketEvent((data) => {
        switch(data.f){
            case'video_delete':
                if(tabTree.name === 'videosTableView' && monitorsList.val() === data.mid){
                    var videoIndexToRemove = loadedVideosTable.findIndex(row => new Date(row.time).getTime() === new Date(data.time).getTime())
                    if(videoIndexToRemove !== -1){
                        loadedVideosTable.splice(videoIndexToRemove, 1);
                        delete(loadedVideosInMemory[`${data.mid}${data.time}`])
                        clearTimeout(redrawTimeout)
                        redrawTimeout = setTimeout(function(){
                            drawVideosTableViewElements(true)
                        },2000)
                    }
                }
            break;
            case'video_compress_started':
                console.log(`Compressing Video...`,data)
            break;
            case'video_compress_completed':
                if(data.success){
                    var progressItem = sideLinkListBox.find(`[data-mid="${data.mid}"][data-ke="${data.mid}"][data-name="${data.name}"]`)
                    var saveBuiltVideo = dashboardOptions().switches.saveCompressedVideo
                    if(saveBuiltVideo === 1){
                        downloadCompressedVideo(data)
                        progressItem.remove()
                        console.log(`Downloaded!`,data)
                    }else if(!data.automated){
                        progressItem.find('.row-status').text(`${lang.Done}!`)
                        progressItem.find('.dot').removeClass('dot-orange').addClass('dot-green')
                        progressItem.find('.download-button').show()
                        progressItem.find('.progress-bar').css('width',`100%`).text(`100%`)
                    }else if(data.automated){
                        progressItem.remove()
                    }
                }
            break;
            case'video_compress_percent':
                var progressItem = sideLinkListBox.find(`[data-mid="${data.mid}"][data-ke="${data.mid}"][data-name="${data.name}"]`)
                data.percent = data.percent > 100 ? 100 : data.percent
                if(progressItem.length === 0){
                    drawCompressedVideoProgressBar(data)
                }else{
                    progressItem = sideLinkListBox.find(`[data-mid="${data.mid}"][data-ke="${data.mid}"][data-name="${data.name}"]`)
                    progressItem.find('.progress-bar').css('width',`${data.percent}%`).text(`${data.percent}%`)
                }
                console.log(data)
            break;
        }
    })
    addOnTabOpen('videosTableView', function () {
        drawMonitorListToSelector(monitorsList,null,null,true)
        drawVideosTableViewElements()
    })
    addOnTabReopen('videosTableView', function () {
        var theSelected = `${monitorsList.val()}`
        drawMonitorListToSelector(monitorsList,null,null,true)
        monitorsList.val(theSelected)
    })
    addOnTabAway('videosTableView', function () {
        videosTablePreviewArea.find('video')[0].pause()
    })
})
