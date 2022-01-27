module.exports = (s,config,lang) => {
    function buildMontageInputsFromPriorConsumption(monitors){
        const inputs = []
        monitors.forEach((monitor) => {
            const hostPoint = `http://${config.ip || 'localhost'}:${config.port}`
            var streamURL = ''
            switch(monitor.type){
                case'mjpeg':
                    streamURL = '/'+req.params.auth+'/mjpeg/'+v.ke+'/'+v.mid
                break;
                case'hls':
                    streamURL = '/'+req.params.auth+'/hls/'+v.ke+'/'+v.mid+'/s.m3u8'
                break;
                case'h264':
                    streamURL = '/'+req.params.auth+'/h264/'+v.ke+'/'+v.mid
                break;
                case'flv':
                    streamURL = '/'+req.params.auth+'/flv/'+v.ke+'/'+v.mid+'/s.flv'
                break;
                case'mp4':
                    streamURL = '/'+req.params.auth+'/mp4/'+v.ke+'/'+v.mid+'/s.mp4'
                break;
            }
            if(streamURL)inputs.push(`-i ${hostPoint + streamURL}`)
        })
        return inputs.join(' ')
    }
    function filterMonitorsListForMontage(monitors){
        let monitorsSelected = ([]).concat(monitors).filter((monitor) => {
            const monitorType = monitor.type;
            return monitorType === 'mjpeg' ||
                monitorType === 'hls' ||
                monitorType === 'flv' ||
                monitorType === 'mp4' ||
                monitorType === 'h264'
        });
        if(monitorsSelected.length <= 4){
            monitorsSelected = monitorsSelected.slice(0, 3)
        }else if(monitorsSelected.length <= 9){
            monitorsSelected = monitorsSelected.slice(0, 8)
        }
        return monitorsSelected
    }
    function calculateFilterComplexForMontage(monitors){
        const theString = []
        let monitorsSelected = ([]).concat(monitors)
        if(monitorsSelected.length <= 4){
            monitorsSelected = monitorsSelected.slice(0, 3)
            theString.push(`-filter_complex "
                nullsrc=size=640x480 [base];
                [0:v] setpts=PTS-STARTPTS, scale=320x240 [upperleft];
                [1:v] setpts=PTS-STARTPTS, scale=320x240 [upperright];
                [2:v] setpts=PTS-STARTPTS, scale=320x240 [lowerleft];
                [3:v] setpts=PTS-STARTPTS, scale=320x240 [lowerright];
                [base][upperleft] overlay=shortest=1 [tmp1];
                [tmp1][upperright] overlay=shortest=1:x=320 [tmp2];
                [tmp2][lowerleft] overlay=shortest=1:y=240 [tmp3];
                [tmp3][lowerright] overlay=shortest=1:x=320:y=240
            "`)
        }else if(monitorsSelected.length <= 9){
            monitorsSelected = monitorsSelected.slice(0, 8)
            theString.push(`-filter_complex "
        		nullsrc=size=1920x1080 [base];
        		[0:v] setpts=PTS-STARTPTS, scale=640x360 [upperleft];
        		[1:v] setpts=PTS-STARTPTS, scale=640x360 [uppercenter];
        		[2:v] setpts=PTS-STARTPTS, scale=640x360 [upperright];
        		[3:v] setpts=PTS-STARTPTS, scale=640x360 [centerleft];
        		[4:v] setpts=PTS-STARTPTS, scale=640x360 [centercenter];
        		[5:v] setpts=PTS-STARTPTS, scale=640x360 [centerright];
        		[6:v] setpts=PTS-STARTPTS, scale=640x360 [lowerleft];
        		[7:v] setpts=PTS-STARTPTS, scale=640x360 [lowercenter];
        		[8:v] setpts=PTS-STARTPTS, scale=640x360 [lowerright];
        		[base][upperleft] overlay=shortest=1 [tmp1];
        		[tmp1][uppercenter] overlay=shortest=1:x=640 [tmp2];
        		[tmp2][upperright] overlay=shortest=1:x=1280 [tmp3];
        		[tmp3][centerleft] overlay=shortest=1:y=360 [tmp4];
        		[tmp4][centercenter] overlay=shortest=1:x=640:y=360 [tmp5];
        		[tmp5][centerright] overlay=shortest=1:x=1280:y=360 [tmp6];
        		[tmp6][lowerleft] overlay=shortest=1:y=720 [tmp7];
        		[tmp7][lowercenter] overlay=shortest=1:x=640:y=720 [tmp8];
        		[tmp8][lowerright] overlay=shortest=1:x=1280:y=720
        	"`)
        }
        return theString.join(' ')
    }
    function buildHlsOutputForMontage(groupKey){
        return `-c:v libx264 -an -f hls -live_start_index -3 -hls_time 5 -hls_list_size 3 -start_number 0 -hls_allow_cache 0 -hls_flags +delete_segments+omit_endlist "${s.dir.streams}${groupKey}/montage.m3u8"`
    }
    return {
        buildMontageInputsFromPriorConsumption,
        calculateFilterComplexForMontage,
        filterMonitorsListForMontage,
        buildHlsOutputForMontage,
    }
}
