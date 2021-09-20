$(document).ready(function(){
    var streamCarouselBlock = $('#stream-carousel')
    var loadedCarouselBlocks = []
    var changeTimer = null;
    var currentCarouselMonitorId = null;
    function canBackgroundCarousel(){
        return tabTree && tabTree.name === 'initial' && dashboardOptions().switches.backgroundCarousel === 1
    }
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
        console.log(`loadMonitorInCarousel`,monitorId)
        currentCarouselMonitorId = `${monitorId}`
        streamCarouselBlock
            .find(`.carousel-block[data-mid="${monitorId}"]`)
            .addClass('active-block')
            .find('iframe')
            .attr('src',`${getApiPrefix(`embed`)}/${monitorId}/fullscreen|jquery|relative`)
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
        },6000)
    }
    function setAutoChangerInterval(){
        stopAutoChangerInterval()
        changeTimer = setInterval(goNextCarouselBlock,20000)
    }
    function stopAutoChangerInterval(){
        clearTimeout(changeTimer)
    }
    function initCarousel(){
        drawCarouselSet()
        if(loadedCarouselBlocks[0]){
            console.log(loadedCarouselBlocks[0])
            loadMonitorInCarousel(currentCarouselMonitorId || loadedCarouselBlocks[0])
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
    $(window).focus(function(){
        if(canBackgroundCarousel()){
            initCarousel()
        }
    }).blur(function(){
        if(canBackgroundCarousel()){
            clearCarouselFrames()
            stopAutoChangerInterval()
        }
    })
})
