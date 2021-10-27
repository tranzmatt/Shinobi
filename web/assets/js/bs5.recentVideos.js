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
            callback(data)
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
