$(document).ready(function(){
    var theEnclosure = $('#tab-studio')
    var timelineStrip = $('#studioTimelineStrip')
    var timelineStripTimeTicksContainer = $('#studio-time-ticks')
    var timelineStripSliceSelection = $('#studio-slice-selection')
    var loadedVideoForSlicer = null
    var timelineStripMousemoveX = 0
    var timelineStripMousemoveY = 0
    var slicerQueue = {}
    function initStudio(){
        function onChange(){
            console.log(getSliceSelection())
        }
        timelineStripSliceSelection.resizable({
            containment: '#studioTimelineStrip',
            handles: "e,w",
        });
        timelineStripSliceSelection.resize(onChange)
        timelineStripSliceSelection.draggable({
            containment: '#studioTimelineStrip',
            axis: "x",
            drag: onChange,
        });
    }
    function validateTimeSlot(timeValue){
        var roundedValue = Math.round(timeValue)
        return `${roundedValue}`.length === 1 ? `0${roundedValue}` :  roundedValue
    }
    function getTimeInfo(timePx,stripWidth,timeDifference){
        var timePercent = timePx / stripWidth * 100
        var timeSeconds = (timeDifference * (timePercent / 100))
        // var timeMinutes = parseInt(timeSeconds / 60)
        // var timeLastSeconds = timeSeconds - (timeMinutes * 60)
        // var timestamp = `00:${validateTimeSlot(timeMinutes)}:${validateTimeSlot(timeLastSeconds)}`
        return {
            timePercent,
            timeSeconds,
            // timeMinutes,
            // timeLastSeconds,
            // timestamp,
        }
    }
    function getSliceSelection(){
        var startTime = new Date(loadedVideoForSlicer.time)
        var endTime = new Date(loadedVideoForSlicer.end)
        var timeDifference = (endTime - startTime) / 1000
        var stripWidth = timelineStrip.width()
        //
        var startTimePx = timelineStripSliceSelection.position().left
        var startTimeInfo = getTimeInfo(startTimePx,stripWidth,timeDifference)
        //
        var endTimePx = startTimePx + timelineStripSliceSelection.width()
        var endTimeInfo = getTimeInfo(endTimePx,stripWidth,timeDifference)
        return {
            // startTimestamp: startTimeInfo.timestamp,
            // endTimestamp: endTimeInfo.timestamp,
            startTimeSeconds: startTimeInfo.timeSeconds,
            endTimeSeconds: endTimeInfo.timeSeconds
        }
    }
    function sliceVideo(){
        var video = Object.assign({},loadedVideoForSlicer)
        var monitorId = video.mid
        var filename = video.filename
        var groupKey = video.ke
        const sliceInfo = getSliceSelection()
        $.get(`${getApiPrefix('videos')}/${monitorId}/${filename}/slice?startTime=${sliceInfo.startTimeSeconds}&endTime=${sliceInfo.endTimeSeconds}`,function(data){
            console.log('sliceVideo',data)
        })
    }
    function drawTimeTicks(video){
        var startTime = moment(video.time)
        var endTime = moment(video.end)
        var amountOfSecondsBetween = moment.duration(endTime.diff(startTime)).asSeconds();
        var numberOfTicks = amountOfSecondsBetween / 20
        var tickStripWidth = timelineStripTimeTicksContainer.width()
        var tickSpacingWidth = tickStripWidth / numberOfTicks
        var tickSpacingPercent = tickSpacingWidth / tickStripWidth * 100
        var tickHtml = ''
        for (let i = 1; i < numberOfTicks; i++) {
            var tickPercent = tickSpacingPercent * i
            var numberOfSecondsForTick = parseInt(amountOfSecondsBetween / numberOfTicks) * i;

            tickHtml += `<div class="tick" style="left:${tickPercent}%"><span>${numberOfSecondsForTick}s</span></div>`;
        }
        timelineStripTimeTicksContainer.html(tickHtml)
    }
    function loadVideoIntoSlicer(video){
        loadedVideoForSlicer = Object.assign({},video)
        drawTimeTicks(video)
    }
    $(window).resize(function(){
        drawTimeTicks(loadedVideoForSlicer)
    })
    $('body')
    .on('click','.open-video-studio',function(e){
        e.preventDefault()
        var el = $(this).parents('[data-mid]')
        var monitorId = el.attr('data-mid')
        var videoTime = el.attr('data-time')
        var video = loadedVideosInMemory[`${monitorId}${videoTime}`]
        openTab('studio')
        loadVideoIntoSlicer(video)
        return false;
    });
    theEnclosure
    .on('click','.slice-video',function(){
        sliceVideo()
    });
    initStudio()
})
