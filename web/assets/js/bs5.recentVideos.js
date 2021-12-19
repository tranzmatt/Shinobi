$(document).ready(function(){
    var theBlock = $('#recentVideos')
    var theList = $('#recentVideosList')
    var videoRangeEl = $('#recentVideosRange')
    var monitorList = theBlock.find('.monitors_list')
    function drawRowToList(row,toBegin,returnLastChild){
        theList[toBegin ? 'prepend' : 'append'](createVideoRow(row))
        if(returnLastChild){
            var theChildren = theList.children()
            return toBegin ? theChildren.first() : theChildren.last()
        }
    }
    function drawDaysToList(videos,toBegin){
        var videosSortedByDays = sortVideosByDays(videos)
        $.each(videosSortedByDays,function(monitorId,days){
            $.each(days,function(dayKey,videos){
                var copyOfVideos = ([]).concat(videos).reverse()
                theList.append(createDayCard(copyOfVideos,dayKey,monitorId))
                var theChildren = theList.children()
                var createdCardCarrier = toBegin ? theChildren.first() : theChildren.last()
                bindFrameFindingByMouseMoveForDay(createdCardCarrier,dayKey,copyOfVideos)
                preloadAllTimelapseFramesToMemoryFromVideoList(copyOfVideos)
            })
        })
    }
    function loadVideos(options,callback){
        theList.empty();
        var currentDate = new Date()
        var videoRange = parseInt(videoRangeEl.val()) || 72
        options.videoRange = videoRange
        options.startDate = moment(currentDate).subtract(videoRange, 'hours')._d;
        options.endDate = moment(currentDate)._d;
        console.log(options)
        function drawVideoData(data){
            var html = ``
            var videos = data.videos || []
            // $.each(videos,function(n,row){
            //     var createdCardCarrier = drawRowToList(row,false,true)
            //     bindFrameFindingByMouseMove(createdCardCarrier,row)
            // })
            drawDaysToList(videos,false)
            getCountOfEvents(options)
            callback(data)
        }
        getVideos(options,function(data){
            if(data.videos.length === 0){
                options.limit = 20
                delete(options.startDate)
                delete(options.endDate)
                getVideos(options,drawVideoData)
            }else{
                drawVideoData(data)
            }
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
    function onRecentVideosFieldChange(){
        var theSelected = `${monitorList.val()}`
        loadVideos({
            limit: 10,
            monitorId: theSelected || undefined,
        },function(){
            liveStamp()
        })
    }
    monitorList.change(onRecentVideosFieldChange);
    videoRangeEl.change(onRecentVideosFieldChange);
    theBlock.find('.recent-videos-refresh').click(function(){
        var theSelected = `${monitorList.val()}`
        drawMonitorListToSelector(monitorList.find('optgroup'))
        monitorList.val(theSelected)
        loadVideos({
            limit: 20,
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
                    limit: 20,
                },function(){
                    liveStamp()
                })
            break;
            // case'video_build_success':
            //     loadVideoData(d)
            //     var createdCardCarrier = drawRowToList(createVideoLinks(d),true)
            //     bindFrameFindingByMouseMove(createdCardCarrier,row)
            // break;
        }
    })
})
