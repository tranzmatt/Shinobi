var os = require('os');
var exec = require('child_process').exec;
module.exports = function(s,config,lang,app,io){
    const {
        startMove,
        stopMove,
        ptzControl,
    } = require('./control/ptz.js')(s,config,lang)
    require('./control/onvif.js')(s,config,lang,app,io)
    require('./control/zwave.js')(s,config,lang,app,io)
    // const ptz = require('./control/ptz.js')(s,config,lang,app,io)
    s.onOtherWebSocketMessages((data,connection) => {
        switch(data.f){
            case'monitor':
                switch(data.ff){
                    case'startMove':
                        startMove(data)
                    break;
                    case'stopMove':
                        stopMove(data)
                    break;
                    case'control':
                        ptzControl(data,function(msg){
                            s.userLog(data,msg);
                            connection.emit('f',{
                                f: 'control',
                                response: msg
                            })
                        })
                    break;
                }
            break;
        }
    })
}
