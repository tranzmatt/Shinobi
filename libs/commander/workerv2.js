const { parentPort } = require('worker_threads');
process.on("uncaughtException", function(error) {
  console.error(error);
});
let remoteConnectionPort = 8080
const net = require("net")
const bson = require('bson')
const WebSocket = require('cws')
const s = {
    debugLog: (...args) => {
        parentPort.postMessage({
            f: 'debugLog',
            data: args
        })
    },
    systemLog: (...args) => {
        parentPort.postMessage({
            f: 'systemLog',
            data: args
        })
    },
}
parentPort.on('message',(data) => {
    switch(data.f){
        case'init':
            const config = data.config
            remoteConnectionPort = config.ssl ? config.ssl.port || 443 : config.port || 8080
            initialize(config,data.lang)
        break;
        case'exit':
            s.debugLog('Closing P2P Connection...')
            process.exit(0)
        break;
    }
})
function createWebsocketConnection(p2pServerAddress){
    return new Promise((resolve,reject) => {
        const newTunnel = new WebSocket(p2pServerAddress || 'ws://172.16.101.218:81');
        newTunnel.on('open', function(){
            resolve(newTunnel)
        })
    })
}
function startConnection(p2pServerAddress,subscriptionId){
    console.log('Connecting to Konekta P2P Server...')
    let tunnelToShinobi
    let stayDisconnected = false
    const allMessageHandlers = []
    async function startWebsocketConnection(key,callback){
        function disconnectedConnection(code,reason){
            s.debugLog('stayDisconnected',stayDisconnected)
            if(stayDisconnected)return;
            s.debugLog('DISCONNECTED! RESTARTING!')
            setTimeout(() => {
                startWebsocketConnection()
            },2000)
        }
        try{
            if(tunnelToShinobi)tunnelToShinobi.close()
        }catch(err){
            console.log(err)
        }
        s.debugLog(p2pServerAddress)
        tunnelToShinobi = await createWebsocketConnection(p2pServerAddress)
        console.log('Connected! Authenticating...')
        sendDataToTunnel({
            subscriptionId: subscriptionId || '0z7BTxsCgk76nyn6kxfSkTzjYQ1CyofCiUktxdo4'
        })
        tunnelToShinobi.on('error', (err) => {
            console.log(err)
        });
        tunnelToShinobi.on('close', disconnectedConnection);
        tunnelToShinobi.onmessage = function(event){
            const data = bson.deserialize(Buffer.from(event.data))
            allMessageHandlers.forEach((handler) => {
                if(data.f === handler.key){
                    handler.callback(data.data,data.rid)
                }
            })
        }
    }
    function sendDataToTunnel(data){
        tunnelToShinobi.send(
            bson.serialize(data)
        )
    }
    startWebsocketConnection()
    function onIncomingMessage(key,callback){
        allMessageHandlers.push({
            key: key,
            callback: callback,
        })
    }
    function outboundMessage(key,data,requestId){
        sendDataToTunnel({
            f: key,
            data: data,
            rid: requestId
        })
    }
    function createRemoteSocket(host,port,requestId){
        // if(requestConnections[requestId]){
        //     remotesocket.off('data')
        //     remotesocket.off('drain')
        //     remotesocket.off('close')
        //     requestConnections[requestId].end()
        // }
        let remotesocket = new net.Socket();
        remotesocket.connect(port || remoteConnectionPort, host || 'localhost');
        requestConnections[requestId] = remotesocket
        remotesocket.on('data', function(data) {
            outboundMessage('data',data,requestId)
        })
        remotesocket.on('drain', function() {
            outboundMessage('resume',{},requestId)
        });
        remotesocket.on('close', function() {
            outboundMessage('end',{},requestId)
        });
        return remotesocket
    }
    function writeToServer(data,requestId){
        var flushed = requestConnections[requestId].write(data.buffer)
        if (!flushed) {
            outboundMessage('pause',{},requestId)
        }
    }
    const requestConnections = []
    // onIncomingMessage('connect',(data,requestId) => {
    //     console.log('New Request Incoming',requestId)
    //     createRemoteSocket('172.16.101.94', 8080, requestId)
    // })
    onIncomingMessage('connect',(data,requestId) => {
        // const hostParts = data.host.split(':')
        // const host = hostParts[0]
        // const port = parseInt(hostParts[1]) || 80
        s.debugLog('New Request Incoming', null, null, requestId)
        const socket = createRemoteSocket(null, null, requestId)
        socket.on('ready',() => {
            s.debugLog('READY')
            writeToServer(data.init,requestId)
        })
    })
    onIncomingMessage('data',writeToServer)
    onIncomingMessage('resume',function(data,requestId){
        requestConnections[requestId].resume()
    })
    onIncomingMessage('pause',function(data,requestId){
        requestConnections[requestId].pause()
    })
    onIncomingMessage('end',function(data,requestId){
        try{
            requestConnections[requestId].end()
        }catch(err){
            s.debugLog(err)
            // console.log('requestConnections',requestConnections)
        }
    })
    onIncomingMessage('disconnect',function(data,requestId){
        stayDisconnected = true
    })
}

function initialize(config,lang){
    const selectedP2PServerId = config.p2pServerList[config.p2pHostSelected] ? config.p2pHostSelected : Object.keys(config.p2pServerList)[0]
    const p2pServerDetails = config.p2pServerList[selectedP2PServerId]
    const selectedHost = 'ws://' + p2pServerDetails.host + ':' + p2pServerDetails.p2pPort
    startConnection(selectedHost,config.p2pApiKey)
}
