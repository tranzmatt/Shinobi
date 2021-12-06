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
function applyDataListToVideos(videos,events,keyName,reverseList){
    var updatedVideos = videos.concat([])
    var currentEvents = events.concat([])
    updatedVideos.forEach(function(video){
        var videoEvents = []
        currentEvents.forEach(function(theEvent,index){
            var startTime = new Date(video.time)
            var endTime = new Date(video.end)
            var eventTime = new Date(theEvent.time)
            if(theEvent.mid === video.mid && eventTime >= startTime && eventTime <= endTime){
                videoEvents.push(theEvent)
                currentEvents.splice(index, 1)
            }
        })
        if(reverseList)videoEvents = videoEvents.reverse()
        video[keyName || 'events'] = videoEvents
    })
    return updatedVideos
}
function applyTimelapseFramesListToVideos(videos,events,keyName,reverseList){
    var thisApiPrefix = getApiPrefix() + '/timelapse/' + $user.ke + '/'
    var newVideos = applyDataListToVideos(videos,events,keyName,reverseList)
    newVideos.forEach(function(video){
        video.timelapseFrames.forEach(function(row){
            var apiURL = thisApiPrefix + row.mid
            row.href = libURL + apiURL + '/' + row.filename.split('T')[0] + '/' + row.filename
        })
    })
    return newVideos
}
function getFrameOnVideoRow(percentageInward,video){
    var startTime = new Date(video.time)
    var endTime = new Date(video.end)
    var timeDifference = endTime - startTime
    var timeInward = timeDifference / (100 / percentageInward)
    var timeAdded = new Date(startTime.getTime() + timeInward) // ms
    // video.timelapseFrames.forEach(function(row){
    //     var isValid = new Date(row.time) > timeAdded
    //     console.log(new Date(row.time),timeAdded)
    //     if(isValid)console.log(row.time)
    //
    // })
    var foundFrame = video.timelapseFrames.find(function(row){
        return new Date(row.time) > timeAdded
    });
    return foundFrame
}
function bindFrameFindingByMouseMove(createdCardCarrier,video){
    var createdCardElement = createdCardCarrier.find('.card').first()
    var timeImg = createdCardElement.find('.video-time-img')
    var timeStrip = createdCardElement.find('.video-time-strip')
    var timeNeedleSeeker = createdCardElement.find('.video-time-needle-seeker')
    if(video.timelapseFrames.length > 0){
        createdCardElement.on('mousemove',function(evt){
            var offest = createdCardElement.offset()
            var elementWidth = createdCardElement.width() + 2
            var amountMoved = evt.pageX - offest.left
            var percentMoved = amountMoved / elementWidth * 100
            var frameFound = getFrameOnVideoRow(percentMoved,video)
            if(frameFound){
                timeImg.css('background-image',`url(${frameFound.href})`)
            }
            timeNeedleSeeker.css('left',`${amountMoved}px`)
        })
        timeImg.css('background-image',`url(${getFrameOnVideoRow(1,video).href})`)
    }else{
        if(video.events.length === 0){
            timeStrip.hide()
        }else{
            var eventMatrixHtml = ``
            var objectsFound = {}
            eventMatrixHtml += `
                    <table class="table table-striped mb-0">
                    <tr>
                      <th scope="col" class="${definitions.Theme.isDark ? 'text-white' : ''} text-epic">${lang.Events}</th>
                      <th scope="col" class="text-end"><span class="badge bg-light text-dark rounded-pill">${video.events.length}</span></th>
                    </tr>`
                $.each(([]).concat(video.events).splice(0,11),function(n,theEvent){
                    var imagePath = `${formattedTimeForFilename(theEvent.time,false,'YYYY-MM-DD')}/${formattedTimeForFilename(theEvent.time,false,'YYYY-MM-DDTHH-mm-ss')}.jpg`
                    possibleEventFrames += `<div class="col-4 mb-2"><img class="rounded pop-image cursor-pointer" style="max-width:100%;" src="${getApiPrefix('timelapse')}/${theEvent.mid}/${imagePath}" onerror="$(this).parent().remove()"></div>`
                })
                $.each(video.events,function(n,theEvent){
                    $.each(theEvent.details.matrices,function(n,matrix){
                        if(!objectsFound[matrix.tag])objectsFound[matrix.tag] = 1
                        ++objectsFound[matrix.tag]
                    })
                })
                $.each(objectsFound,function(tag,count){
                    eventMatrixHtml += `<tr>
                        <td class="${definitions.Theme.isDark ? 'text-white' : ''}" style="text-transform:capitalize">${tag}</td>
                        <td class="text-end"><span class="badge badge-dark text-white rounded-pill">${count}</span></td>
                    </tr>`
                })
                eventMatrixHtml += `</table>`
                timeStrip.append(eventMatrixHtml)
        }
        timeImg.css('min-height',`auto`).addClass('video-time-no-img')
    }
}
function getPercentOfTimePositionFromVideo(video,theEvent){
    var startTime = new Date(video.time)
    var endTime = new Date(video.end)
    var eventTime = new Date(theEvent.time)
    var rangeMax = endTime - startTime
    var eventMs = eventTime - startTime
    var percentChanged = eventMs / rangeMax * 100

    console.log(`percentChanged`,percentChanged)
    return percentChanged
}
function createVideoRow(row,classOverride){
    var eventMatrixHtml = ``
    if(row.events && row.events.length > 0){
        $.each(row.events,function(n,theEvent){
            var leftPercent = getPercentOfTimePositionFromVideo(row,theEvent)
            eventMatrixHtml += `<div class="video-time-needle video-time-needle-event" style="left:${leftPercent}%"></div>`
        })
    }
    var videoEndpoint = getLocation() + '/' + $user.auth_token + '/videos/' + $user.ke + '/' + row.mid + '/' + row.filename
    return `
    <div class="video-row ${classOverride ? classOverride : `col-md-12 col-lg-6 mb-3`} search-row" data-mid="${row.mid}" data-time="${row.time}" data-time-formed="${new Date(row.time)}">
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
            <div class="video-time-img">
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
                </div>
            </div>
            <div class="video-time-strip card-footer p-0">
                ${eventMatrixHtml}
                <div class="video-time-needle video-time-needle-seeker" style="z-index: 2"></div>
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
    $.getJSON(`${getApiPrefix(`videos`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.concat([`limit=${limit}`]).join('&')}`,function(data){
        var videos = data.videos
        $.getJSON(`${getApiPrefix(`timelapse`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.join('&')}`,function(timelapseFrames){
            $.getJSON(`${getApiPrefix(`events`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.join('&')}`,function(eventData){
                console.log(timelapseFrames)
                var newVideos = applyDataListToVideos(videos,eventData)
                newVideos = applyTimelapseFramesListToVideos(newVideos,timelapseFrames,'timelapseFrames',true)
                $.each(newVideos,function(n,video){
                    loadVideoData(video)
                })
                callback({videos: newVideos})
            })
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
    $.getJSON(`${getApiPrefix(`events`)}${monitorId ? `/${monitorId}` : ''}?${requestQueries.join('&')}`,function(eventData){
        callback(eventData)
    })
}
onWebSocketEvent(function(d){
    switch(d.f){
        case'video_delete':
            console.log(d)
            $('[file="'+d.filename+'"][mid="'+d.mid+'"]:not(.modal)').remove();
            $('[data-file="'+d.filename+'"][data-mid="'+d.mid+'"]:not(.modal)').remove();
            $('[data-time-formed="'+(new Date(d.time))+'"][data-mid="'+d.mid+'"]:not(.modal)').remove();
            // if($.powerVideoWindow.currentDataObject&&$.powerVideoWindow.currentDataObject[d.filename]){
            //     delete($.timelapse.currentVideos[$.powerVideoWindow.currentDataObject[d.filename].position])
            //     $.powerVideoWindow.drawTimeline(false)
            // }
            // if($.timelapse.currentVideos&&$.timelapse.currentVideos[d.filename]){
            //     delete($.timelapse.currentVideosArray.videos[$.timelapse.currentVideos[d.filename].position])
            //     $.timelapse.drawTimeline(false)
            // }
            // if($.vidview.loadedVideos && $.vidview.loadedVideos[d.filename])delete($.vidview.loadedVideos[d.filename])
        break;
    }
})
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
                $.getJSON(videoEndpoint + '/delete',function(data){
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
