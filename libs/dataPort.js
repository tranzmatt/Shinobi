const url = require('url');
module.exports = function(s,config,lang,app,io){
    const {
        triggerEvent,
    } = require('./events/utils.js')(s,config,lang)
    // options = options ? options : {}
    // options.port = options.port || 3001
    s.dataPortTokens = {}
    const WebSocket = require('cws');
    const theWebSocket = new WebSocket.Server({
        noServer: true
    });
    function setClientKillTimerIfNotAuthenticatedInTime(client){
        client.killTimer = setTimeout(function(){
            client.terminate()
        },10000)
    }
    function clearKillTimer(client){
        clearTimeout(client.killTimer)
    }
    theWebSocket.on('connection',(client) => {
        // client.send(someDataToSendAsStringOrBinary)
        setClientKillTimerIfNotAuthenticatedInTime(client)
        function onAuthenticate(data){
            clearKillTimer(client)
            if(s.dataPortTokens[data]){
                client.removeListener('message', onAuthenticate);
                client.on('message', onAuthenticatedData)
                delete(s.dataPortTokens[data]);
            }else{
                client.terminate()
            }
        }
        function onAuthenticatedData(jsonData){
            const data = JSON.parse(jsonData);
            switch(data.f){
                case'trigger':
                    triggerEvent(data)
                break;
                case's.tx':
                    s.tx(data.data,data.to)
                break;
                case'debugLog':
                    s.debugLog(data.data)
                break;
                default:
                    console.log(data)
                break;
            }
            s.onDataPortMessageExtensions.forEach(function(extender){
                extender(data)
            })
        }
        client.on('message', onAuthenticate)
        client.on('close', () => {
            clearTimeout(client.killTimer)
        })
        client.on('disconnect', () => {
            clearTimeout(client.killTimer)
        })
    })
    s.onHttpRequestUpgrade('/dataPort',(request, socket, head) => {
        theWebSocket.handleUpgrade(request, socket, head, function done(ws) {
            theWebSocket.emit('connection', ws, request)
        })
    })
}
