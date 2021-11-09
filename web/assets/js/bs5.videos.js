var loadedVideosInMemory = {}
function createVideoLinks(video){
    var details = safeJsonParse(video.details)
    var queryString = []
    // if(details.isUTC === true){
    //     queryString.push('isUTC=true')
    // }else{
    //     video.time = s.utcToLocal(video.time)
    //     video.end = s.utcToLocal(video.end)
    // }
    if(queryString.length > 0){
        queryString = '?' + queryString.join('&')
    }else{
        queryString = ''
    }
    video.ext = video.ext ? video.ext : 'mp4'
    if(details.type === 'googd'){
        video.href = undefined
    }else if(!video.ext && video.href){
        video.ext = video.href.split('.')
        video.ext = video.ext[video.ext.length - 1]
    }
    video.filename = formattedTimeForFilename(video.time,null,`YYYY-MM-DDTHH-mm-ss`) + '.' + video.ext;
    var href = getApiPrefix('videos') + '/'+video.mid+'/'+video.filename;
    video.actionUrl = href
    video.links = {
        deleteVideo : href+'/delete' + queryString,
        changeToUnread : href+'/status/1' + queryString,
        changeToRead : href+'/status/2' + queryString
    }
    if(!video.href || options.hideRemote === true)video.href = href + queryString
    video.details = details
    return video
}
function applyEventListToVideos(videos,events){
    var updatedVideos = videos.concat([])
    var currentEvents = events.concat([])
    updatedVideos.forEach(function(video){
        var videoEvents = []
        currentEvents.forEach(function(theEvent,index){
            var startTime = new Date(video.time)
            var endTime = new Date(video.end)
            var eventTime = new Date(theEvent.time)
            if(eventTime >= startTime && eventTime <= endTime){
                videoEvents.push(theEvent)
                currentEvents.splice(index, 1)
            }
        })
        video.events = videoEvents
    })
    return updatedVideos
}
function createVideoRow(row,classOverride){
    var possibleEventFrames = ''
    var hasRows = row.events && row.events.length > 0
    if(hasRows){
        var eventMatrixHtml = ``
        var objectsFound = {}
        eventMatrixHtml += `
                <table class="table table-striped mb-0">
                <tr>
                  <th scope="col" class="${definitions.Theme.isDark ? 'text-white' : ''} text-epic">${lang.Events}</th>
                  <th scope="col" class="text-end"><span class="badge bg-light text-dark rounded-pill">${row.events.length}</span></th>
                </tr>`
            $.each(([]).concat(row.events).splice(0,11),function(n,theEvent){
                var imagePath = `${formattedTimeForFilename(theEvent.time,false,'YYYY-MM-DD')}/${formattedTimeForFilename(theEvent.time,false,'YYYY-MM-DDTHH-mm-ss')}.jpg`
                possibleEventFrames += `<div class="col-4 mb-2"><img class="rounded pop-image cursor-pointer" style="max-width:100%;" src="${getApiPrefix('timelapse')}/${theEvent.mid}/${imagePath}" onerror="$(this).parent().remove()"></div>`
            })
            $.each(row.events,function(n,theEvent){
                $.each(theEvent.details.matrices,function(n,matrix){
                    if(!objectsFound[matrix.tag])objectsFound[matrix.tag] = 1
                    ++objectsFound[matrix.tag]
                })
            })
            $.each(objectsFound,function(tag,count){
                eventMatrixHtml += `<tr>
                    <td class="${definitions.Theme.isDark ? 'text-white' : ''}" style="text-transform:capitalize">${tag}</td>
                    <td class="text-end"><span class="badge ${definitions.Theme.isDark ? 'bg-light text-dark' : 'bg-dark text-white'} rounded-pill">${count}</span></td>
                </tr>`
            })
            eventMatrixHtml += `</table>`
    }
    var videoEndpoint = getLocation() + '/' + $user.auth_token + '/videos/' + $user.ke + '/' + row.mid + '/' + row.filename
    return `
    <div class="video-row ${classOverride ? classOverride : `col-md-12 col-lg-6 mb-3`} search-row" data-mid="${row.mid}" data-time="${row.time}">
        <div class="card shadow-lg px-0 btn-default">
            <div class="card-header d-flex flex-row">
                <div class="flex-grow-1 ${definitions.Theme.isDark ? 'text-white' : ''}">
                    ${loadedMonitors[row.mid] ? loadedMonitors[row.mid].name : row.mid}
                </div>
                <div>
                    <a class="badge btn btn-primary open-video mr-1" title="${lang['Watch']}"><i class="fa fa-play-circle"></i></a>
                    <a class="badge btn btn-success" download href="${videoEndpoint}" title="${lang['Download']}"><i class="fa fa-download"></i></a>
                    <a class="badge btn btn-danger delete-video" title="${lang['Delete']}"><i class="fa fa-trash-o"></i></a>
                </div>
            </div>
            <div class="card-body">
                <div title="${row.time}" class="d-flex flex-row">
                    <div class="flex-grow-1">
                        ${moment(row.time).fromNow()}
                    </div>
                    <div>
                        <small class="text-muted">~${durationBetweenTimes(row.time,row.end)} ${lang.Minutes}</small>
                    </div>
                </div>
                <div title="${row.time}" class="d-flex flex-row border-bottom-dotted border-bottom-dark mb-2">
                    <div>
                        <div title="${row.time}"><small class="text-muted">${lang.Started} : ${formattedTime(row.time,true)}</small></div>
                        <div title="${row.end}"><small class="text-muted">${lang.Ended} : ${formattedTime(row.end,true)}</small></div>
                    </div>
                </div>
                <div class="row">${possibleEventFrames}</div>
            </div>
            <div class="card-footer p-0">
                ${hasRows ? eventMatrixHtml : `<div class="p-3"><small class="text-muted">${lang['No Events found for this video']}</small></div>`}
            </div>
        </div>
    </div>`
}
function drawVideoRowsToList(targetElement,rows){
    var theVideoList = $(targetElement)
    theVideoList.empty()
    $.each(rows,function(n,row){
        theVideoList.append(createVideoRow(row))
    })
    liveStamp()
}
function loadVideoData(video){
    delete(video.f)
    loadedVideosInMemory[`${video.mid}${video.time}`] = video
}
function getVideos(options,callback){
    options = options ? options : {}
    var requestQueries = []
    var monitorId = options.monitorId
    var limit = options.limit || 5000
    var eventStartTime
    var eventEndTime
    // var startDate = options.startDate
    // var endDate = options.endDate
    if(options.startDate){
        eventStartTime = formattedTimeForFilename(options.startDate,false)
        requestQueries.push(`start=${eventStartTime}`)
    }
    if(options.endDate){
        eventEndTime = formattedTimeForFilename(options.endDate,false)
        requestQueries.push(`end=${eventEndTime}`)
    }
    $.get(`${getApiPrefix(`videos`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.concat([`limit=${limit}`]).join('&')}`,function(data){
        var videos = data.videos
        $.get(`${getApiPrefix(`events`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.join('&')}`,function(eventData){
            var newVideos = applyEventListToVideos(videos,eventData)
            $.each(newVideos,function(n,video){
                loadVideoData(video)
            })
            callback({videos: newVideos})
        })
    })
}
function getEvents(options,callback){
    options = options ? options : {}
    var requestQueries = []
    var monitorId = options.monitorId
    var limit = options.limit || 5000
    var eventStartTime
    var eventEndTime
    // var startDate = options.startDate
    // var endDate = options.endDate
    if(options.startDate){
        eventStartTime = formattedTimeForFilename(options.startDate,false)
        requestQueries.push(`start=${eventStartTime}`)
    }
    if(options.endDate){
        eventEndTime = formattedTimeForFilename(options.endDate,false)
        requestQueries.push(`end=${eventEndTime}`)
    }
    if(options.onlyCount){
        requestQueries.push(`onlyCount=1`)
    }
    $.get(`${getApiPrefix(`events`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.join('&')}`,function(eventData){
        callback(eventData)
    })
}
$(document).ready(function(){
    $('body')
    .on('click','.open-video',function(){
        var el = $(this).parents('[data-mid]')
        var monitorId = el.attr('data-mid')
        var videoTime = el.attr('data-time')
        var video = loadedVideosInMemory[`${monitorId}${videoTime}`]
        createVideoPlayerTab(video)
    })
    .on('click','.delete-video',function(){
        var el = $(this).parents('[data-mid]')
        var monitorId = el.attr('data-mid')
        var videoTime = el.attr('data-time')
        var video = loadedVideosInMemory[`${monitorId}${videoTime}`]
        var ext = video.filename.split('.')
        ext = ext[ext.length - 1]
        var videoEndpoint = getLocation() + '/' + $user.auth_token + '/videos/' + $user.ke + '/' + video.mid + '/' + video.filename
        $.confirm.create({
            title: lang["Delete Video"] + ' : ' + video.filename,
            body: `${lang.DeleteVideoMsg}<br><br><div class="row"><video class="video_video" autoplay loop controls><source src="${videoEndpoint}" type="video/${ext}"></video></div>`,
            clickOptions: {
                title: '<i class="fa fa-trash-o"></i> ' + lang.Delete,
                class: 'btn-danger btn-sm'
            },
            clickCallback: function(){
                $.get(videoEndpoint + '/delete',function(data){
                    if(data.ok){
                        console.log('Video Deleted')
                    }else{
                        console.log('Video Not Deleted',data,deleteEndpoint)
                    }
                })
            }
        })
    })
})
