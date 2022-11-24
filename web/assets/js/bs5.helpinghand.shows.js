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
                    $('#tab-monitorStates [name="name"]').focus().val('');
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
                    $('#tab-monitorStates [name="name"]').focus().val('');
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
            /// set schedule
            {
                time: 1,
                handPos: {
                    el: `[page-open="schedules"]`
                },
                cmd: () => {
                    openTab('schedules',{})
                }
            },
        ]
    }
}
