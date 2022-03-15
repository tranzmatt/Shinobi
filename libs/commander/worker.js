const { parentPort } = require('worker_threads');
const WebSocket = require('ws');
const bson = require('bson');
const p2pClientConnectionStaticName = 'Commander'
const p2pClientConnections = {}
const runningRequests = {}
const connectedUserWebSockets = {}
let connectionToP2PServer
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
            initialize(data.config,data.lang)
        break;
        case'exit':
            s.debugLog('Closing P2P Connection...')
            process.exit(0)
        break;
    }
})

const initialize = (config,lang) => {
    const {
        parseJSON,
        createQueryStringFromObject,
        doRequest,
        createShinobiSocketConnection,
        killAllClientConnections,
    } = require('./utils.js')(config,lang,p2pClientConnections)
    // const {
    //     doRequest,
    // } = require('./utilsv1.js')(s,config,lang,p2pClientConnections)
    const selectedP2PServerId = config.p2pServerList[config.p2pHostSelected] ? config.p2pHostSelected : Object.keys(config.p2pServerList)[0]
    const selectedHost = config.p2pServerList[selectedP2PServerId].host + ':' + config.p2pServerList[selectedP2PServerId].p2pPort
    //
    function startBridge(noLog){
        s.debugLog('p2p',`Connecting to ${selectedHost}...`)
        if(connectionToP2PServer){
            try{
                connectionToP2PServer.allowDisconnect = true;
                connectionToP2PServer.close()
            }catch(err){
                s.debugLog(err)
            }
        }

        // connectionToP2PServer = socketIOClient('ws://' + selectedHost, {transports:['websocket']});
        s.debugLog('ws://' + selectedHost + '/v2')
        connectionToP2PServer = new WebSocket('ws://' + selectedHost + '/v2');
        connectionToP2PServer.binaryType = 'arraybuffer';
        let pendingOutboundMessages = []
        connectionToP2PServer.outboundMessage = (key,data) => {
            s.debugLog('queue OUTBOUND',key)
            pendingOutboundMessages.push({
                f: key,
                data: data
            })
        }
        connectionToP2PServer.on('open', () => {
            connectionToP2PServer.outboundMessage = (key,data) => {
                s.debugLog('OUTBOUND MESSAGE',key)
                connectionToP2PServer.send(
                    bson.serialize({
                        f: key,
                        data: data
                    })
                )
            }
            pendingOutboundMessages.forEach((message) => {
                s.debugLog('SEND QUEUED OUTBOUND',message.f)
                connectionToP2PServer.outboundMessage(message.f,message.data)
            })
            delete(pendingOutboundMessages)
        })
        const allMessageHandlers = []
        connectionToP2PServer.onmessage = function(event){
            const data = bson.deserialize(Buffer.from(event.data))
            allMessageHandlers.forEach((handler) => {
                if(data.f === handler.key){
                    handler.callback(data.data)
                }
            })
        }
        function onIncomingMessage(key,callback){
            allMessageHandlers.push({
                key: key,
                callback: callback,
            })
        }
        connectionToP2PServer.onInboundMessage = onIncomingMessage
        // connectionToP2PServer.on('open', heartbeat);
        // connectionToP2PServer.on('ping', heartbeat);
        if(!config.p2pApiKey){
            if(!noLog)s.systemLog('p2p',`Please fill 'p2pApiKey' in your conf.json.`)
        }
        // if(!config.p2pGroupId){
        //     if(!noLog)s.systemLog('p2p',`Please fill 'p2pGroupId' in your conf.json.`)
        // }
        connectionToP2PServer.on('open', () => {
            if(!noLog)s.systemLog('p2p',`Connected ${selectedHost}!`);
            setTimeout(() => {
                connectionToP2PServer.outboundMessage('initMachine',{
                    port: config.port,
                    apiKey: config.p2pApiKey,
                    groupId: config.p2pGroupId,
                    targetUserId: config.p2pTargetUserId,
                    targetGroupId: config.p2pTargetGroupId
                })
            },3000)
        })
        connectionToP2PServer.onInboundMessage('httpClose',(requestId) => {
            if(runningRequests[requestId] && runningRequests[requestId].abort){
                runningRequests[requestId].abort()
                delete(runningRequests[requestId])
            }
        })
        connectionToP2PServer.onInboundMessage('http',(rawRequest) => {
            const urlParts = rawRequest.url.split('/');
            const forceStream = urlParts[2] === 'img'
            const hasCallback = !forceStream && rawRequest.focus !== 'mp4' && rawRequest.focus !== 'flv' && rawRequest.focus !== 'mjpeg' && rawRequest.focus !== 'h264';
            s.debugLog('doRequest hasCallback',hasCallback,'rawRequest.bodyOnEnd',rawRequest.bodyOnEnd)
            runningRequests[rawRequest.rid] = doRequest(
              rawRequest.url,
              rawRequest.method,
              rawRequest.data,
              connectionToP2PServer.outboundMessage,
              hasCallback ? function(err,json,resp){
                  connectionToP2PServer.outboundMessage('httpResponse',{
                      err: err,
                      json: rawRequest.bodyOnEnd ? json : null,
                      headers: resp.headers || {},
                      rid: rawRequest.rid
                  })
              } : null,
              (data) => {
                  if(forceStream || !rawRequest.bodyOnEnd)connectionToP2PServer.outboundMessage('httpResponseChunk',{
                      data: data,
                      rid: rawRequest.rid
                  })
              })
        })
        // const masterConnectionToMachine = createShinobiSocketConnection()
        // masterConnectionToMachine.on('connect', () => {
        //     masterConnectionToMachine.emit('f',{
        //         f: 'init',
        //         auth: config.p2pTargetAuth,
        //         ke: config.p2pTargetGroupId,
        //         uid: config.p2pTargetUserId
        //     })
        // })
        // masterConnectionToMachine.on('f',(data) => {
        //     connectionToP2PServer.outboundMessage('f',data)
        // })

        connectionToP2PServer.onInboundMessage('wsInit',(rawRequest) => {
            const user = rawRequest.user
            const clientConnectionToMachine = createShinobiSocketConnection(rawRequest.cnid)
            connectedUserWebSockets[user.auth_token] = user;
            clientConnectionToMachine.on('connect', () => {
                s.debugLog('init',user.auth_token)
                clientConnectionToMachine.emit('f',{
                    f: 'init',
                    auth: user.auth_token,
                    ke: user.ke,
                    uid: user.uid,
                    ipAddress: rawRequest.ipAddress
                })
            });
            ([
              'f',
            ]).forEach((target) => {
                connectionToP2PServer.onInboundMessage(target,(data) => {
                    clientConnectionToMachine.emit(target,data)
                })
                clientConnectionToMachine.on(target,(data) => {
                    connectionToP2PServer.outboundMessage(target,{data: data, cnid: rawRequest.cnid})
                })
            })
        });
        ([
          'a',
          'r',
          'gps',
          'e',
          'super',
        ]).forEach((target) => {
            connectionToP2PServer.onInboundMessage(target,(data) => {
                var clientConnectionToMachine
                if(data.f === 'init'){
                    clientConnectionToMachine = createShinobiSocketConnection(data.cnid)
                    clientConnectionToMachine.on('connect', () => {
                        clientConnectionToMachine.on(target,(fromData) => {
                            connectionToP2PServer.outboundMessage(target,{data: fromData, cnid: data.cnid})
                        })
                        clientConnectionToMachine.on('f',(fromData) => {
                            connectionToP2PServer.outboundMessage('f',{data: fromData, cnid: data.cnid})
                        })
                        clientConnectionToMachine.emit(target,data)
                    });
                }else{
                    clientConnectionToMachine = p2pClientConnections[data.cnid]
                    clientConnectionToMachine.emit(target,data)
                }
            })

        });
        config.workerStreamOutHandlers.forEach((target) => {
            connectionToP2PServer.onInboundMessage(target,(initData) => {
                if(connectedUserWebSockets[initData.auth]){
                    const clientConnectionToMachine = createShinobiSocketConnection(initData.auth + initData.ke + initData.id)
                    clientConnectionToMachine.on('connect', () => {
                        clientConnectionToMachine.emit(target,initData)
                    });
                    clientConnectionToMachine.on('data',(data) => {
                        connectionToP2PServer.outboundMessage('data',{data: data, cnid: initData.cnid})
                    });
                }else{
                    s.debugLog('disconnect now!')
                }
            })
        });
        connectionToP2PServer.onInboundMessage('wsDestroyStream',(clientKey) => {
            if(p2pClientConnections[clientKey]){
                p2pClientConnections[clientKey].disconnect();
            }
            delete(p2pClientConnections[clientKey])
        });
        connectionToP2PServer.onInboundMessage('wsDestroy',(rawRequest) => {
            if(p2pClientConnections[rawRequest.cnid]){
                p2pClientConnections[rawRequest.cnid].disconnect();
            }
            delete(p2pClientConnections[rawRequest.cnid])
        });

        connectionToP2PServer.onInboundMessage('allowDisconnect',(bool) => {
            connectionToP2PServer.allowDisconnect = true;
            connectionToP2PServer.close()
            s.debugLog('p2p','Server Forced Disconnection')
        });
        const onDisconnect = () => {
            if(!noLog)s.systemLog('p2p','P2P Disconnected');
            killAllClientConnections()
            if(!connectionToP2PServer.allowDisconnect){
                if(!noLog)s.systemLog('p2p','Attempting Reconnection...');
                setTimeout(() => {
                    startBridge()
                },3000)
            }else{
                if(!noLog)s.systemLog('p2p','Closing Process');
                process.exit()
            }
        }
        connectionToP2PServer.on('error',onDisconnect)
        connectionToP2PServer.on('close',onDisconnect)
    }
    startBridge()
    setInterval(function(){
        if(
            (!connectionToP2PServer || !connectionToP2PServer.connected) &&
            !connectionToP2PServer.allowDisconnect
        ){
            connectionToP2PServer.connect()
        }
    },1000 * 60 * 15)
}
