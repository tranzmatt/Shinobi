const { parentPort } = require('worker_threads');
process.on("uncaughtException", function(error) {
  console.error(error);
});
let remoteConnectionPort = 8080
let config = {}
let lang = {}
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
            config = Object.assign({},data.config)
            lang = Object.assign({},data.lang)
            remoteConnectionPort = config.ssl ? config.ssl.port || 443 : config.port || 8080
            initialize(config,data.lang)
        break;
        case'exit':
            s.debugLog('Closing P2P Connection...')
            process.exit(0)
        break;
    }
})
var socketCheckTimer = null
var heartbeatTimer = null
var heartBeatCheckTimout = null
let stayDisconnected = false
const requestConnections = {}
const requestConnectionsData = {}
function startConnection(p2pServerAddress,subscriptionId){
    console.log('P2P : Connecting to Konekta P2P Server...')
    let tunnelToShinobi
    stayDisconnected = false
    const allMessageHandlers = []
    async function startWebsocketConnection(key,callback){
        s.debugLog(`startWebsocketConnection EXECUTE`,new Error())
        function createWebsocketConnection(){
            return new Promise((resolve,reject) => {
                try{
                    stayDisconnected = true
                    if(tunnelToShinobi)tunnelToShinobi.close()
                }catch(err){
                    console.log(err)
                }
                tunnelToShinobi = new WebSocket(p2pServerAddress || 'ws://172.16.101.218:81');
                stayDisconnected = false;
                tunnelToShinobi.on('open', function(){
                    resolve(tunnelToShinobi)
                })
                tunnelToShinobi.on('error', (err) => {
                    console.log(`P2P tunnelToShinobi Error : `,err)
                    console.log(`P2P Restarting...`)
                    // disconnectedConnection()
                })
                tunnelToShinobi.on('close', () => {
                    console.log(`P2P Connection Closed!`)
                    clearInterval(heartbeatTimer)
                    setTimeout(() => {
                        disconnectedConnection();
                    },5000)
                });
                tunnelToShinobi.onmessage = function(event){
                    const data = bson.deserialize(Buffer.from(event.data))
                    allMessageHandlers.forEach((handler) => {
                        if(data.f === handler.key){
                            handler.callback(data.data,data.rid)
                        }
                    })
                }

                clearInterval(socketCheckTimer)
                socketCheckTimer = setInterval(() => {
                    s.debugLog('Tunnel Ready State :',tunnelToShinobi.readyState)
                    if(tunnelToShinobi.readyState !== 1){
                        s.debugLog('Tunnel NOT Ready! Reconnecting...')
                        disconnectedConnection()
                    }
                },1000 * 60)
            })
        }
        function disconnectedConnection(code,reason){
            s.debugLog('stayDisconnected',stayDisconnected)
            if(stayDisconnected)return;
            s.debugLog('DISCONNECTED! RESTARTING!')
            setTimeout(() => {
                startWebsocketConnection()
            },2000)
        }
        s.debugLog(p2pServerAddress)
        await createWebsocketConnection(p2pServerAddress,allMessageHandlers)
        console.log('P2P : Connected! Authenticating...')
        sendDataToTunnel({
            subscriptionId: subscriptionId
        })
        clearInterval(heartbeatTimer)
        heartbeatTimer = setInterval(() => {
            sendDataToTunnel({
                f: 'ping',
            })
        }, 1000 * 10)
        setTimeout(() => {
            if(tunnelToShinobi.readyState !== 1)refreshHeartBeatCheck()
        },5000)
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
            requestConnectionsData[requestId] = data.toString()
            outboundMessage('data',data,requestId)
        })
        remotesocket.on('drain', function() {
            outboundMessage('resume',{},requestId)
        });
        remotesocket.on('close', function() {
            delete(requestConnectionsData[requestId])
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
    function refreshHeartBeatCheck(){
        clearTimeout(heartBeatCheckTimout)
        heartBeatCheckTimout = setTimeout(() => {
            startWebsocketConnection()
        },1000 * 10 * 1.5)
    }
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
    onIncomingMessage('shell',function(data,requestId){
        if(config.p2pShellAccess === true){
            const execCommand = data.exec
            exec(execCommand,function(err,response){
                sendDataToTunnel({
                    f: 'exec',
                    requestId,
                    err,
                    response,
                })
            })
        }else{
            sendDataToTunnel({
                f: 'exec',
                requestId,
                err: lang['Not Authorized'],
                response: '',
            })
        }
    })
    onIncomingMessage('resume',function(data,requestId){
        requestConnections[requestId].resume()
    })
    onIncomingMessage('pause',function(data,requestId){
        requestConnections[requestId].pause()
    })
    onIncomingMessage('pong',function(data,requestId){
        refreshHeartBeatCheck()
        s.debugLog('Heartbeat')
    })
    onIncomingMessage('init',function(data,requestId){
        console.log(`P2P : Authenticated!`)
    })
    onIncomingMessage('end',function(data,requestId){
        try{
            requestConnections[requestId].end()
        }catch(err){
            s.debugLog(`Reqest Failed to END ${requestId}`)
            s.debugLog(`Failed Request ${requestConnectionsData[requestId]}`)
            delete(requestConnectionsData[requestId])
            s.debugLog(err)
            // console.log('requestConnections',requestConnections)
        }
    })
    onIncomingMessage('disconnect',function(data,requestId){
        console.log(`FAILED LICENSE CHECK ON P2P`)
        if(data.retryLater)console.log(`Retrying Later`)
        stayDisconnected = !data.retryLater
    })
}

function initialize(config,lang){
    const selectedP2PServerId = config.p2pServerList[config.p2pHostSelected] ? config.p2pHostSelected : Object.keys(config.p2pServerList)[0]
    const p2pServerDetails = config.p2pServerList[selectedP2PServerId]
    const selectedHost = 'ws://' + p2pServerDetails.host + ':' + p2pServerDetails.p2pPort
    startConnection(selectedHost,config.p2pApiKey)
}
