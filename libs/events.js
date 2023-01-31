module.exports = function(s,config,lang){
    require('./events/onvif.js')(s,config,lang)
    require('./events/noEventsDetector.js')(s,config,lang)
}
