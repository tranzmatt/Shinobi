$(document).ready(function(e){
    //Timelapse JPEG Window
    var theEnclosure = $('#tab-calendarView')
    var monitorsList = theEnclosure.find('.monitors_list')
    var dateSelector = theEnclosure.find('.date_selector')
    var calendarDrawArea = $('#calendar_draw_area')
    var loadedVideosInMemory = {};
    var openCalendarView = function(monitorId,startDate,endDate){
        drawCalendarViewElements(monitorId,startDate,endDate)
    }
    var getSelectedTime = function(asUtc){
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
        drawCalendarViewElements()
    })
    monitorsList.change(function(){
        drawCalendarViewElements()
    })
    var drawCalendarViewElements = function(selectedMonitor,startDate,endDate){
        var dateRange = getSelectedTime(false)
        if(!startDate)startDate = dateRange.startDate
        if(!endDate)endDate = dateRange.endDate
        if(!selectedMonitor)selectedMonitor = monitorsList.val()
        var queryString = ['start=' + startDate,'end=' + endDate,'limit=0']
        var frameIconsHtml = ''
        var apiURL = getApiPrefix('videos') + '/' + selectedMonitor;
        var calendarData = []
        loadedVideosInMemory = {}
        $.getJSON(apiURL + '?' + queryString.join('&'),function(data){
            $.each(data.videos,function(n,v){
                if(v.status !== 0){
                    loadedVideosInMemory[v.filename] = Object.assign({},v)
                    var loadedMonitor = loadedMonitors[v.mid]
                    if(loadedMonitor){
                        v.title = loadedMonitor.name+' - '+(parseInt(v.size)/1048576).toFixed(2)+'mb';
                    }
                    v.start = moment.utc(v.time).local()
                    v.end = moment.utc(v.end).local()
                    calendarData.push(v)
                }
            })
            try{
                calendarDrawArea.fullCalendar('destroy')
            }catch(er){

            }
            calendarDrawArea.fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay,listWeek'
                },
                defaultDate: moment(startDate).format('YYYY-MM-DD'),
                locale: $user.details.lang.substring(0, 2),
                navLinks: true,
                eventLimit: true,
                events: calendarData,
                eventClick: function(v){
                    var video = loadedVideosInMemory[v.filename]
                    createVideoPlayerTab(video)
                    $(this).css('border-color', 'red');
                }
            });

        })
    }

    $('body').on('click','.open-timelapse-viewer',function(){
        var el = $(this).parents('[data-mid]')
        var monitorId = el.attr('data-mid')
        openTab(`calendarView`,{},null)
        monitorsList.val(monitorId).change()
    })
    addOnTabOpen('calendarView', function () {
        drawMonitorListToSelector(monitorsList)
        drawCalendarViewElements()
    })
    addOnTabReopen('calendarView', function () {
        var theSelected = `${monitorsList.val()}`
        drawMonitorListToSelector(monitorsList)
        monitorsList.val(theSelected)
    })
})
