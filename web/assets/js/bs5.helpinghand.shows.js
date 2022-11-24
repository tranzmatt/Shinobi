var helpingHandShows = {
    "test-show": {
        name: 'test-show',
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
                cmd: () => {
                    $('#tab-monitorStates [name="name"]').focus().val('');
                    typeWriteInField('test this','#tab-monitorStates [name="name"]');
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
                    el: `#tab-monitorStates .add-monitor`
                },
                cmd: () => {
                    $('#tab-monitorStates .state-monitor-row-fields-container [data-name="detail=detector"]').click();
                    $('#tab-monitorStates .state-monitor-row-fields-container').animate({scrollTop: $('[data-name="detail=detector"]').position().top},1500);
                }
            },
            // {
            //     time: 1.5,
            //     handPos: {
            //         top: 40,
            //         left: 60,
            //     }
            // },
        ]
    }
}
