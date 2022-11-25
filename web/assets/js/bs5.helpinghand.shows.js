var helpingHandShows = {
    "motion-preset-pair": {
        name: 'Add a Motion Detection On/Off Preset Pair',
        playlist: [
            {
                time: 1,
                handPos: {
                    el: `[page-open="monitorStates"]`
                },
                cmd: () => {
                    openTab('monitorStates',{})
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#monitorStatesSelector`
                },
                cmd: () => {
                    $('#monitorStatesSelector option').prop('selected',false);
                    $('#monitorStatesSelector').val('').change();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates [name="name"]`
                },
                cmd: async () => {
                    await typeWriteInField('Motion Detection On','#tab-monitorStates [name="name"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .add-monitor`
                },
                cmd: () => {
                    $('#tab-monitorStates .add-monitor').click();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row .state-monitor-row-select`
                },
                cmd: () => {
                    var monitorId = getSelectedHelpingHandMonitorTarget();
                    $(`#tab-monitorStates .state-monitor-row .state-monitor-row-select`).val(monitorId)
                }
            },
            {
                time: 0.2,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container`
                },
                cmd: () => {
                    var optionsSelected = $('#tab-monitorStates .state-monitor-row-fields-container')
                    var scrollBodyHeight = optionsSelected.height()
                    var detectorOption = optionsSelected.find('[data-name="detail=detector"]');
                    optionsSelected.animate({scrollTop: detectorOption.position().top - scrollBodyHeight},1000);
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"]`
                },
                cmd: () => {
                    var optionsSelected = $('#tab-monitorStates .state-monitor-row-fields-container')
                    var detectorOption = optionsSelected.find('[data-name="detail=detector"]').click();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"] select`
                },
                cmd: () => {
                    $('#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"] select').val('1');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .sticky-bar [type="submit"]`
                },
                cmd: () => {
                    $('#tab-monitorStates form').submit();
                }
            },
            /// Motion Off
            {
                time: 1,
                handPos: {
                    el: `#monitorStatesSelector`
                },
                cmd: () => {
                    $('#monitorStatesSelector option').prop('selected',false);
                    $('#monitorStatesSelector').val('').change();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates [name="name"]`
                },
                cmd: async () => {
                    await typeWriteInField('Motion Detection Off','#tab-monitorStates [name="name"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .add-monitor`
                },
                cmd: () => {
                    $('#tab-monitorStates .add-monitor').click();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row .state-monitor-row-select`
                },
                cmd: () => {
                    var monitorId = getSelectedHelpingHandMonitorTarget();
                    $(`#tab-monitorStates .state-monitor-row .state-monitor-row-select`).val(monitorId)
                }
            },
            {
                time: 0.2,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container`
                },
                cmd: () => {
                    var optionsSelected = $('#tab-monitorStates .state-monitor-row-fields-container')
                    var scrollBodyHeight = optionsSelected.height()
                    var detectorOption = optionsSelected.find('[data-name="detail=detector"]');
                    optionsSelected.animate({scrollTop: detectorOption.position().top - scrollBodyHeight},1000);
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"]`
                },
                cmd: () => {
                    var optionsSelected = $('#tab-monitorStates .state-monitor-row-fields-container')
                    var detectorOption = optionsSelected.find('[data-name="detail=detector"]').click();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"] select`
                },
                cmd: () => {
                    $('#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"] select').val('0');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-monitorStates .sticky-bar [type="submit"]`
                },
                cmd: () => {
                    $('#tab-monitorStates form').submit();
                }
            },
            /// set schedule, motion ON
            {
                time: 1,
                handPos: {
                    el: `[page-open="schedules"]`
                },
                cmd: () => {
                    openTab('schedules',{})
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#schedulesSelector`
                },
                cmd: () => {
                    $('#schedulesSelector option').prop('selected',false);
                    $('#schedulesSelector').val('').change();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="name"]`
                },
                cmd: async () => {
                    await typeWriteInField('Motion Detection On','#tab-schedules [name="name"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="enabled"]`
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="start"]`
                },
                cmd: async () => {
                    await typeWriteInField('00:00','#tab-schedules [name="start"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="end"]`
                },
                cmd: async () => {
                    await typeWriteInField('23:00','#tab-schedules [name="end"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="days"]`
                },
                cmd: async () => {
                    var daysSelector = $('#tab-schedules [name="days"]');
                    daysSelector.find('option').prop('selected',false)
                    daysSelector.find('[value="0"],[value="2"],[value="4"],[value="6"]').prop('selected',true)
                }
            },
            {
                time: 2,
                handPos: {
                    el: `#tab-schedules [name="monitorStates"]`
                },
                cmd: async () => {
                    var presetSelector = $('#tab-schedules [name="monitorStates"]');
                    presetSelector.find('option').prop('selected',false)
                    presetSelector.find('[value="Motion Detection On"]').prop('selected',true)
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules .sticky-bar [type="submit"]`
                },
                cmd: () => {
                    $('#tab-schedules form').submit();
                }
            },
            /// set schedule, motion OFF
            {
                time: 3,
                handPos: {
                    el: `#schedulesSelector`
                },
                cmd: () => {
                    $('#schedulesSelector option').prop('selected',false);
                    $('#schedulesSelector').val('').change();
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="name"]`
                },
                cmd: async () => {
                    await typeWriteInField('Motion Detection Off','#tab-schedules [name="name"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="enabled"]`
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="start"]`
                },
                cmd: async () => {
                    await typeWriteInField('00:00','#tab-schedules [name="start"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="end"]`
                },
                cmd: async () => {
                    await typeWriteInField('23:00','#tab-schedules [name="end"]');
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules [name="days"]`
                },
                cmd: async () => {
                    var daysSelector = $('#tab-schedules [name="days"]');
                    daysSelector.find('option').prop('selected',false)
                    daysSelector.find('[value="1"],[value="3"],[value="5"]').prop('selected',true)
                }
            },
            {
                time: 2,
                handPos: {
                    el: `#tab-schedules [name="monitorStates"]`
                },
                cmd: async () => {
                    var presetSelector = $('#tab-schedules [name="monitorStates"]');
                    presetSelector.find('option').prop('selected',false)
                    presetSelector.find('[value="Motion Detection Off"]').prop('selected',true)
                }
            },
            {
                time: 1,
                handPos: {
                    el: `#tab-schedules .sticky-bar [type="submit"]`
                },
                cmd: () => {
                    $('#tab-schedules form').submit();
                }
            },
        ]
    }
}
