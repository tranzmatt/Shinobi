var fs = require('fs')
var execSync = require('child_process').execSync
var P2P = require('pipe2pam')
var PamDiff = require('pam-diff')
module.exports = function(jsonData,pamDiffResponder){
    const noiseFilterArray = {};
    const completeMonitorConfig = jsonData.rawMonitorConfig
    const groupKey = completeMonitorConfig.ke
    const monitorId = completeMonitorConfig.mid
    const monitorDetails = completeMonitorConfig.details
    const triggerTimer = {}
    let regionJson
    try{
        regionJson = JSON.parse(monitorDetails.cords)
    }catch(err){
        regionJson = monitorDetails.cords
    }
    let fullFrame = null
    const width = parseInt(monitorDetails.detector_scale_x) || 640
    const height = parseInt(monitorDetails.detector_scale_y) || 480
    const globalSensitivity = parseInt(monitorDetails.detector_sensitivity) || 10
    const globalColorThreshold = parseInt(monitorDetails.detector_color_threshold) || 9
    const globalThreshold = parseInt(monitorDetails.detector_threshold) || 0
    const regionsAreMasks = monitorDetails.detector_frame !== '1' && monitorDetails.inverse_trigger === '1';
    const regionConfidenceMinimums = {}
    if(Object.keys(regionJson).length === 0 || monitorDetails.detector_frame === '1'){
        fullFrame = {
            name:'FULL_FRAME',
            sensitivity: globalSensitivity,
            color_threshold: globalColorThreshold,
            points:[
                [0,0],
                [0,height],
                [width,height],
                [width,0]
            ]
        }
    }
    const mask = {
        max_sensitivity : globalSensitivity,
        threshold : globalThreshold,
    }
    const regions = createPamDiffRegionArray(regionJson,globalColorThreshold,globalSensitivity,fullFrame)
    const pamDiffOptions = {
        mask: regionsAreMasks,
        grayscale: 'luminosity',
        regions : regions.forPam,
        percent : globalSensitivity,
        difference : globalColorThreshold,
        response: "blobs",
        draw: true,
    }
    const pamDiff = new PamDiff(pamDiffOptions)
    const p2p = new P2P()
    Object.values(regionJson).forEach(function(region){
        regionConfidenceMinimums[region.name] = region.sensitivity;
    })
    if(typeof pamDiffResponder === 'function'){
      var sendDetectedData = function(detectorObject){
        pamDiffResponder(detectorObject)
      }
    }else{
      var sendDetectedData = function(detectorObject){
        pamDiffResponder.write(Buffer.from(JSON.stringify(detectorObject)))
      }
    }
    function checkMinimumChange(confidence,minimumChangeRequired){
        const amountChanged = confidence
        const minimumChange = !isNaN(minimumChangeRequired) ? parseInt(minimumChangeRequired) : 10
        if(!isNaN(amountChanged)){
            if(amountChanged < minimumChange){
                return false
            }
        }
        return true
    }
    function getRegionsWithMinimumChange(data){
        try{
            var acceptedTriggers = []
            data.trigger.forEach((trigger) => {
                if(checkMinimumChange(trigger.percent,regionConfidenceMinimums[trigger.name] || globalSensitivity)){
                    process.logData(JSON.stringify(trigger))
                    acceptedTriggers.push(trigger)
                }
            })
            return acceptedTriggers
        }catch(err){
            // process.logData(err.stack)
        }
    }
    function createPamDiffEngine(){
        const regionArray = Object.values(regionJson)
        if(jsonData.globalInfo.config.detectorMergePamRegionTriggers === true){
            // merge pam triggers for performance boost
            function buildTriggerEvent(trigger){
                const detectorObject = {
                    f: 'trigger',
                    id: monitorId,
                    ke: groupKey,
                    name: trigger.name,
                    details: {
                        plug:'built-in',
                        name: trigger.name,
                        reason: 'motion',
                        confidence:trigger.percent,
                        matrices: trigger.matrices,
                        imgHeight: monitorDetails.detector_scale_y,
                        imgWidth: monitorDetails.detector_scale_x
                    }
                }
                trigger.acceptedTriggers.forEach(function(triggerPiece){
                    // this looks wrong, keeps triggering?
                    var region = regionsAreMasks ? mask : regionArray.find(x => x.name == triggerPiece.name)
                    checkMaximumSensitivity(region, detectorObject, function(err1) {
                        checkTriggerThreshold(region, detectorObject, function(err2) {
                            if(!err1 && !err2){
                                detectorObject.doObjectDetection = (jsonData.globalInfo.isAtleatOneDetectorPluginConnected && jsonData.rawMonitorConfig.details.detector_use_detect_object === '1')
                                sendDetectedData(detectorObject)
                            }
                        })
                    })
                })
            }
            if(monitorDetails.detector_noise_filter==='1'){
                Object.keys(regions.notForPam).forEach(function(name){
                    if(!noiseFilterArray[name])noiseFilterArray[name]=[];
                })
                pamDiff.on('diff', (data) => {
                    let filteredCount = 0
                    let filteredCountSuccess = 0
                    const acceptedTriggers = getRegionsWithMinimumChange(data)
                    acceptedTriggers.forEach(function(trigger){
                        filterTheNoise(noiseFilterArray,regions,trigger,function(err){
                            ++filteredCount
                            if(!err)++filteredCountSuccess
                            if(filteredCount === acceptedTriggers.length && filteredCountSuccess > 0){
                                buildTriggerEvent(mergePamTriggers(acceptedTriggers))
                            }
                        })
                    })
                })
            }else{
                pamDiff.on('diff', (data) => {
                    buildTriggerEvent(mergePamTriggers(getRegionsWithMinimumChange(data)))
                })
            }
        }else{
            //config.detectorMergePamRegionTriggers NOT true
            //original behaviour, all regions have their own event.
            var buildTriggerEvent = function(trigger){
                const detectorObject = {
                    f: 'trigger',
                    id: monitorId,
                    ke: groupKey,
                    name: trigger.name,
                    details: {
                        plug:'built-in',
                        name: trigger.name,
                        reason: 'motion',
                        confidence:trigger.percent,
                        matrices: trigger.matrices,
                        imgHeight: monitorDetails.detector_scale_y,
                        imgWidth: monitorDetails.detector_scale_x
                    }
                }
                var region = regionsAreMasks ? mask : Object.values(regionJson).find(x => x.name == detectorObject.name)
                checkMaximumSensitivity(region, detectorObject, function(err1) {
                    checkTriggerThreshold(region, detectorObject, function(err2) {
                        if(!err1 && !err2){
                            detectorObject.doObjectDetection = (jsonData.globalInfo.isAtleatOneDetectorPluginConnected && monitorDetails.detector_use_detect_object === '1')
                            sendDetectedData(detectorObject)
                        }
                    })
                })
            }
            if(monitorDetails.detector_noise_filter==='1'){
                Object.keys(regions.notForPam).forEach(function(name){
                    if(!noiseFilterArray[name])noiseFilterArray[name]=[];
                })
                pamDiff.on('diff', (data) => {
                    getRegionsWithMinimumChange(data).forEach(function(trigger){
                        filterTheNoise(noiseFilterArray,regions,trigger,function(){
                            createMatricesFromBlobs(trigger)
                            buildTriggerEvent(trigger)
                        })
                    })
                })
            }else{
                pamDiff.on('diff', (data) => {
                    getRegionsWithMinimumChange(data).forEach(function(trigger){
                        createMatricesFromBlobs(trigger)
                        buildTriggerEvent(trigger)
                    })
                })
            }
        }
    }

    function createPamDiffRegionArray(regions,globalColorThreshold,globalSensitivity,fullFrame){
        var pamDiffCompliantArray = [],
            arrayForOtherStuff = [],
            json
        try{
            json = JSON.parse(regions)
        }catch(err){
            json = regions
        }
        if(fullFrame){
            json[fullFrame.name]=fullFrame;
        }
        Object.values(json).forEach(function(region){
            if(!region)return false;
            region.polygon = [];
            region.points.forEach(function(points){
                var x = parseFloat(points[0]);
                var y = parseFloat(points[1]);
                if(x < 0)x = 0;
                if(y < 0)y = 0;
                region.polygon.push({
                    x: x,
                    y: y
                })
            })
            if(region.sensitivity===''){
                region.sensitivity = globalSensitivity
            }else{
                region.sensitivity = parseInt(region.sensitivity)
            }
            if(region.color_threshold===''){
                region.color_threshold = globalColorThreshold
            }else{
                region.color_threshold = parseInt(region.color_threshold)
            }
            pamDiffCompliantArray.push({name: region.name, difference: region.color_threshold, percent: region.sensitivity, polygon:region.polygon})
            arrayForOtherStuff[region.name] = region;
        })
        if(pamDiffCompliantArray.length===0){pamDiffCompliantArray = null}
        return {forPam:pamDiffCompliantArray,notForPam:arrayForOtherStuff};
    }

    function filterTheNoise(noiseFilterArray,regions,trigger,callback){
        if(noiseFilterArray[trigger.name].length > 2){
            var thePreviousTriggerPercent = noiseFilterArray[trigger.name][noiseFilterArray[trigger.name].length - 1];
            var triggerDifference = trigger.percent - thePreviousTriggerPercent;
            var noiseRange = monitorDetails.detector_noise_filter_range
            if(!noiseRange || noiseRange === ''){
                noiseRange = 6
            }
            noiseRange = parseFloat(noiseRange)
            if(((trigger.percent - thePreviousTriggerPercent) < noiseRange)||(thePreviousTriggerPercent - trigger.percent) > -noiseRange){
                noiseFilterArray[trigger.name].push(trigger.percent);
            }
        }else{
            noiseFilterArray[trigger.name].push(trigger.percent);
        }
        if(noiseFilterArray[trigger.name].length > 10){
            noiseFilterArray[trigger.name] = noiseFilterArray[trigger.name].splice(1,10)
        }
        var theNoise = 0;
        noiseFilterArray[trigger.name].forEach(function(v,n){
            theNoise += v;
        })
        theNoise = theNoise / noiseFilterArray[trigger.name].length;
        var triggerPercentWithoutNoise = trigger.percent - theNoise;
        if(triggerPercentWithoutNoise > regions.notForPam[trigger.name].sensitivity){
            callback(null,trigger)
        }else{
            callback(true)
        }
    }

    function checkMaximumSensitivity(region, detectorObject, callback) {
        var logName = detectorObject.id + ':' + detectorObject.name
        var globalMaxSensitivity = parseInt(monitorDetails.detector_max_sensitivity) || undefined
        var maxSensitivity = parseInt(region.max_sensitivity) || globalMaxSensitivity
        if (maxSensitivity === undefined || detectorObject.details.confidence <= maxSensitivity) {
            callback(null)
        } else {
            callback(true)
            if (triggerTimer[detectorObject.name] !== undefined) {
                clearTimeout(triggerTimer[detectorObject.name].timeout)
                triggerTimer[detectorObject.name] = undefined
            }
        }
    }

    function checkTriggerThreshold(region, detectorObject, callback){
        var threshold = parseInt(region.threshold) || globalThreshold
        if (threshold <= 1) {
            callback(null)
        } else {
            if (triggerTimer[detectorObject.name] === undefined) {
                triggerTimer[detectorObject.name] = {
                    count : threshold,
                    timeout : null
                }
            }
            if (--triggerTimer[detectorObject.name].count == 0) {
                callback(null)
                clearTimeout(triggerTimer[detectorObject.name].timeout)
                triggerTimer[detectorObject.name] = undefined
            } else {
                callback(true)
                var fps = parseFloat(monitorDetails.detector_fps) || 2
                if (triggerTimer[detectorObject.name].timeout !== null)
                    clearTimeout(triggerTimer[detectorObject.name].timeout)
                triggerTimer[detectorObject.name].timeout = setTimeout(function() {
                    triggerTimer[detectorObject.name] = undefined
                }, ((threshold+0.5) * 1000) / fps)
            }
        }
    }
    function mergePamTriggers(acceptedTriggers){
        var n = 0
        var sum = 0
        var matrices = []
        acceptedTriggers.forEach(function(trigger){
            ++n
            sum += trigger.percent
            createMatricesFromBlobs(trigger)
            if(trigger.matrices)matrices.push(...trigger.matrices)
        })
        var average = sum / n
        if(matrices.length === 0)matrices = null
        var trigger = {
            name: `multipleRegions`,
            percent: parseInt(average),
            matrices: matrices,
            acceptedTriggers: acceptedTriggers
        }
        return trigger
    }
    function getXYWidthHeightFromObject(data){
        const coordinates = [
            {"x" : data.minX, "y" : data.minY},
            {"x" : data.maxX, "y" : data.minY},
            {"x" : data.maxX, "y" : data.maxY}
        ]
        return {
            width: Math.sqrt( Math.pow(coordinates[1].x - coordinates[0].x, 2) + Math.pow(coordinates[1].y - coordinates[0].y, 2)),
            height: Math.sqrt( Math.pow(coordinates[2].x - coordinates[1].x, 2) + Math.pow(coordinates[2].y - coordinates[1].y, 2)),
            x: coordinates[0].x,
            y: coordinates[0].y,
        }
    }
    function createMatricesFromBlobs(trigger){
        trigger.matrices = []
        trigger.blobs.forEach(function(blob){
            const {
                width,
                height,
                x,
                y,
            } = getXYWidthHeightFromObject(blob)
            trigger.matrices.push({
                x: x,
                y: y,
                width: width,
                height: height,
                tag: trigger.name
            })
        })
        return trigger
    }
    function createMatrixFromPamTrigger(trigger){
        if(
            trigger.minX ||
            trigger.maxX ||
            trigger.minY ||
            trigger.maxY
        ){
            const {
                width,
                height,
                x,
                y,
            } = getXYWidthHeightFromObject(trigger)
            trigger.matrix = {
                x: x,
                y: y,
                width: width,
                height: height,
                tag: trigger.name
            }
        }
        return trigger
    }

    return function(cameraProcess,fallback){
        if(monitorDetails.detector_pam === '1'){
          createPamDiffEngine()
          cameraProcess.stdio[3].pipe(p2p).pipe(pamDiff)
        }
    };
}
