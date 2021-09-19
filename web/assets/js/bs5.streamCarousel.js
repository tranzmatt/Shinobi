$(document).ready(function(){
    var streamCarouselBlock = $('#stream-carousel')
    var loadedCarouselBlocks = []
    var changeTimer = null;
    var currentCarouselMonitorId = null;
    function drawCarouselSet(){
        var html = ``
        loadedCarouselBlocks = []
        $.each(loadedMonitors,function(id,monitor){
            loadedCarouselBlocks.push(monitor.mid)
            html += `<div data-mid="${monitor.mid}" class="carousel-block"><iframe></iframe></div>`
        })
        streamCarouselBlock.html(html)
    }
    function clearCarouselFrames(){
        $.each(loadedCarouselBlocks,function(n,monitorId){
            deloadMonitorInCarousel(monitorId)
        })
    }
    function loadMonitorInCarousel(monitorId){
        currentCarouselMonitorId = `${monitorId}`
        streamCarouselBlock
            .find(`.carousel-block[data-mid="${monitorId}"]`)
            .addClass('active-block')
            .find('iframe')
            .attr('src',`${getApiPrefix(`embed`)}/${monitorId}/fullscreen|jquery|relative|gui`)
    }
    function deloadMonitorInCarousel(monitorId){
        streamCarouselBlock
            .find(`.carousel-block[data-mid="${monitorId}"]`)
            .removeClass('active-block')
            .find('iframe')
            .attr('src',`about:blank`)
    }
    function goNextCarouselBlock(){
        var oldId = `${currentCarouselMonitorId}`
        var nextId = loadedCarouselBlocks[loadedCarouselBlocks.indexOf(currentCarouselMonitorId) + 1]
        nextId = nextId ? nextId : loadedCarouselBlocks[0]
        loadMonitorInCarousel(nextId)
        setTimeout(function(){
            deloadMonitorInCarousel(oldId)
        },3000)
    }
    function setAutoChangerInterval(){
        stopAutoChangerInterval()
        changeTimer = setInterval(goNextCarouselBlock,10000)
    }
    function stopAutoChangerInterval(){
        clearTimeout(changeTimer)
    }
    function initCarousel(){
        drawCarouselSet()
        if(loadedCarouselBlocks[0]){
            loadMonitorInCarousel(currentCarouselMonitorId || loadedCarouselBlocks[0].mid)
            setAutoChangerInterval()
        }
    }
    addOnTabReopen('initial', function () {
        initCarousel()
    })
    addOnTabAway('initial', function () {
        clearCarouselFrames()
        stopAutoChangerInterval()
    })
    onDashboardReady(function(){
        initCarousel()
    })
})
