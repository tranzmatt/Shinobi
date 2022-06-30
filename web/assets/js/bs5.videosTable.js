$(document).ready(function(e){
    var theEnclosure = $('#tab-videosTableView')
    var monitorsList = theEnclosure.find('.monitors_list')
    var dateSelector = theEnclosure.find('.date_selector')
    var videosTableDrawArea = $('#videosTable_draw_area')
    var videosTablePreviewArea = $('#videosTable_preview_area')
    var loadedVideosTable = [];
    var redrawTimeout;
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
    async function drawVideosTableViewElements(usePreloadedData){
        var dateRange = getSelectedTime(false)
        var startDate = dateRange.startDate
        var endDate = dateRange.endDate
        var monitorId = monitorsList.val()
        var queryString = ['start=' + startDate,'end=' + endDate,'limit=0']
        var frameIconsHtml = ''
        var apiURL = getApiPrefix('videos') + '/' + monitorId;
        if(!usePreloadedData){
            loadedVideosTable = (await getVideos({
                monitorId,
                startDate,
                endDate,
            })).videos;
            $.each(loadedVideosTable,function(n,v){
                loadedVideosInMemory[`${monitorId}${v.time}`]
            })
        }
        videosTableDrawArea.bootstrapTable('destroy')
        videosTableDrawArea.bootstrapTable({
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
                    field: 'time',
                    title: lang['Time Created'],
                  },
                  {
                    field: 'end',
                    title: lang['Ended']
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
                return {
                    mid: file.mid,
                    time: formattedTime(file.time, 'DD-MM-YYYY hh:mm:ss AA'),
                    end: formattedTime(file.end, 'DD-MM-YYYY hh:mm:ss AA'),
                    size: convertKbToHumanSize(file.size),
                    buttons: `
                    <div class="row-info" data-mid="${file.mid}" data-ke="${file.ke}" data-time="${file.time}" data-filename="${file.filename}">
                        <a class="btn btn-sm btn-primary" href="${file.href}" download title="${lang.Download}"><i class="fa fa-download"></i></a>
                        <a class="btn btn-sm btn-primary preview-video" href="${file.href}" title="${lang.Play}"><i class="fa fa-play"></i></a>
                        <a class="btn btn-sm btn-danger delete-video" href="${file.href}" title="${lang.Delete}"><i class="fa fa-trash-o"></i></a>
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
    $('body')
    .on('click','.open-videosTable',function(e){
        e.preventDefault()
        var monitorId = getRowsMonitorId(this)
        openTab(`videosTableView`,{},null,null,null,() => {
            drawMonitorListToSelector(monitorsList)
            monitorsList.val(monitorId)
            drawVideosTableViewElements()
        })
        return false;
    });
    theEnclosure
    .on('click','.preview-video',function(e){
        e.preventDefault()
        var href = $(this).attr('href')
        drawPreviewVideo(href)
        return false;
    })
    .on('click','.delete-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
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
    .on('click','.download-selected-videos',function(e){
        e.preventDefault()
        var videos = getSelectedRows()
        console.log(videos)
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
        }
    })
    addOnTabOpen('videosTableView', function () {
        drawMonitorListToSelector(monitorsList)
        drawVideosTableViewElements()
    })
    addOnTabReopen('videosTableView', function () {
        var theSelected = `${monitorsList.val()}`
        drawMonitorListToSelector(monitorsList)
        monitorsList.val(theSelected)
    })
    addOnTabAway('videosTableView', function () {
        videosTablePreviewArea.find('video')[0].pause()
    })
})
