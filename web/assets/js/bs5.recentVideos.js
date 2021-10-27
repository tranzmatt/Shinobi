$(document).ready(function(){
    var theBlock = $('#recentVideos')
    var theList = $('#recentVideosList')
    var monitorList = theBlock.find('.monitors_list')
    function drawRowToList(row,toBegin){
        theList[toBegin ? 'prepend' : 'append'](createVideoRow(row))
    }
    function loadVideos(options,callback){
        theList.empty();
        getVideos(options,function(data){
            var html = ``
            var videos = data.videos || {}
            $.each(videos,function(n,row){
                drawRowToList(row)
            })
            getCountOfEvents({
                monitorId: options.monitorId,
            })
            callback(data)
        })
    }
    function getCountOfEvents(options){
        var monitorId = options.monitorId
        var loadedMonitor = loadedMonitors[monitorId]
        options.onlyCount = '1';
        if(!options.startDate)options.startDate = moment().subtract(24, 'hour').utc()._d
        if(!options.endDate)options.endDate = moment().add(1, 'hour').utc()._d
        getEvents(options,function(data){
            var eventDesignationText = `${lang['All Monitors']}`
            if(monitorId){
                eventDesignationText = `${loadedMonitor ? loadedMonitor.name : monitorId}`
            }
            $('.events_from_last_24_which_monitor').text(eventDesignationText)
            $('.events_from_last_24').text(data.count)
        })
    }
    monitorList.change(function(){
        var theSelected = `${monitorList.val()}`
        loadVideos({
            limit: 10,
            monitorId: theSelected || undefined,
        },function(){
            liveStamp()
        })
    })
    addOnTabReopen('initial', function () {
        var theSelected = `${monitorList.val()}`
        drawMonitorListToSelector(monitorList.find('optgroup'))
        monitorList.val(theSelected)
        loadVideos({
            limit: 10,
            monitorId: theSelected || undefined,
        },function(){
            liveStamp()
        })
    })
    onWebSocketEvent(function(d){
        switch(d.f){
            case'init_success':
                drawMonitorListToSelector(monitorList.find('optgroup'))
                loadVideos({
                    limit: 10,
                },function(){
                    liveStamp()
                })
            break;
            case'video_build_success':
                loadVideoData(d)
                drawRowToList(createVideoLinks(d),true)
            break;
        }
    })
})
