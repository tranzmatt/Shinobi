$(document).ready(function(e){
    var theEnclosure = $('#tab-videosTableView')
    var monitorsList = theEnclosure.find('.monitors_list')
    var dateSelector = theEnclosure.find('.date_selector')
    var videosTableDrawArea = $('#videosTable_draw_area')
    var videosTablePreviewArea = $('#videosTable_preview_area')
    var loadedVideosInMemory = {};
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
    function drawVideosTableViewElements(selectedMonitor,startDate,endDate){
        var dateRange = getSelectedTime(false)
        if(!startDate)startDate = dateRange.startDate
        if(!endDate)endDate = dateRange.endDate
        if(!selectedMonitor)selectedMonitor = monitorsList.val()
        var queryString = ['start=' + startDate,'end=' + endDate,'limit=0']
        var frameIconsHtml = ''
        var apiURL = getApiPrefix('videos') + '/' + selectedMonitor;
        var videosTableData = []
        loadedVideosInMemory = {}
        $.getJSON(apiURL + '?' + queryString.join('&'),function(data){
            videosTableDrawArea.bootstrapTable('destroy')
            videosTableDrawArea.bootstrapTable({
                pagination: true,
                search: true,
                columns: [
                      {
                        field: 'monitorName',
                        title: lang['Monitor']
                      },
                      {
                        field: 'time',
                        title: lang['Time Created']
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
                data: data.videos.map((file) => {
                    return {
                        monitorName: `<b>${loadedMonitors[file.mid]?.name || file.mid}</b>`,
                        time: `
                            <div><b>${lang.Started}</b> ${formattedTime(file.start, 'DD-MM-YYYY hh:mm:ss AA')}</div>
                            <div><b>${lang.Ended}</b> ${formattedTime(file.end, 'DD-MM-YYYY hh:mm:ss AA')}</div>
                        `,
                        size: convertKbToHumanSize(file.size),
                        buttons: `
                            <a class="btn btn-sm btn-primary" href="${file.href}" download title="${lang.Download}"><i class="fa fa-download"></i></a>
                            <a class="btn btn-sm btn-primary preview-video" href="${file.href}" title="${lang.Play}"><i class="fa fa-play"></i></a>
                        `,
                    }
                })
            })
        })
    }
    function drawPreviewVideo(href){
        videosTablePreviewArea.html(`<video class="video_video" style="width:100%" autoplay controls preload loop src="${href}"></video>`)
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
