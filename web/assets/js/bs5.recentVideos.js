$(document).ready(function(){
    var theBlock = $('#recentVideos')
    var theList = $('#recentVideosList')
    function drawRowToList(row){
        theList.append(createVideoRow(row))
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
    $('body').on('tab-open-initial',function(){
        loadVideos({
            limit: 10,
        },function(){
            liveStamp()
        })
    })
})
