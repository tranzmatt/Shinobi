module.exports = (s,config,lang) => {
    function buildMontageInputsFromPriorConsumption(monitorsForMontage){
        const inputs = []
        monitorsForMontage.forEach((monitor) => {
            const groupKey = monitor.ke
            const monitorId = monitor.mid
            const hostPoint = `http://${config.ip || 'localhost'}:${config.port}`
            var streamURL = ''
            switch(monitor.details.stream_type){
                // case'mjpeg':
                //     streamURL = '/'+req.params.auth+'/mjpeg/'+v.ke+'/'+v.mid
                // break;
                case'hls':
                    streamURL = `${s.dir.streams}/${groupKey}/${monitorId}/s.m3u8`
                break;
                // case'flv':
                //     streamURL = '/'+req.params.auth+'/flv/'+v.ke+'/'+v.mid+'/s.flv'
                // break;
                // case'mp4':
                //     streamURL = '/'+req.params.auth+'/mp4/'+v.ke+'/'+v.mid+'/s.mp4'
                // break;
            }
            if(streamURL)inputs.push(`-i ${streamURL}`)
        })
        if(monitorsForMontage.length < 9){
            var pipeStart = 6
            for (let i = 0; i < monitorsForMontage.length - 9; i++) {
                monitorsInputs.push(`-i pipe:${pipeStart}`)
                ++pipeStart
            }
        }
        return inputs
    }
    function filterMonitorsListForMontage(monitors){
        let monitorsSelected = ([]).concat(monitors).filter((monitor) => {
            const monitorType = monitor.details.stream_type;
            return monitorType === 'hls'
        });
        monitorsSelected = monitorsSelected.slice(0, 8)
        return monitorsSelected
    }
    function calculateFilterComplexForMontage(monitors){
        const theString = []
        let monitorsSelected = ([]).concat(monitors)
        monitorsSelected = monitorsSelected.slice(0, 8)
        theString.push(`-filter_complex "[0:v]scale=320:180[v0];[1:v]scale=320:180[v1];[2:v]scale=320:180[v2];[3:v]scale=320:180[v3];[4:v]scale=320:180[v4];[5:v]scale=320:180[v5];[6:v]scale=320:180[v6];[7:v]scale=320:180[v7];[8:v]scale=320:180[v8];[v0][v1][v2]hstack=3[Row0];[v3][v4][v5]hstack=3[Row1];[v6][v7][v8]hstack=3[Row2];[Row0][Row1][Row2]vstack=3[v]"`)
        return theString.join(' ')
    }
    function buildHlsOutputForMontage(groupKey){
        // filter_complex requires `-map "[v]"` for mosaic
        return `-map "[v]" -c:v ${config.ffmpegforJetsonNano ? 'h264_nvmpi' : 'libx264'} -an -f hls -hls_time 5 -hls_list_size 3 -start_number 0 -hls_allow_cache 0 -hls_flags +delete_segments+omit_endlist "${s.dir.streams}${groupKey}/montage_temp/montage.m3u8"`
    }
    return {
        buildMontageInputsFromPriorConsumption,
        calculateFilterComplexForMontage,
        filterMonitorsListForMontage,
        buildHlsOutputForMontage,
    }
}
