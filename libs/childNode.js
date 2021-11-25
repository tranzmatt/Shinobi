const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const { createWebSocketServer, createWebSocketClient } = require('./basic/websocketTools.js')
module.exports = function(s,config,lang,app,io){
    const { cameraDestroy } = require('./monitor/utils.js')(s,config,lang)
    //setup Master for childNodes
    if(config.childNodes.enabled === true && config.childNodes.mode === 'master'){
        const {
            initiateDataConnection,
            initiateVideoTransferConnection,
            onWebSocketData,
            onDataConnectionDisconnect,
        } = require('./childNode/utils.js')(s,config,lang,app,io)
        s.childNodes = {};
        const childNodesConnectionIndex = {};
        const childNodeHTTP = express();
        const childNodeServer = http.createServer(app);
        const childNodeWebsocket = createWebSocketServer();
        childNodeServer.on('upgrade', function upgrade(request, socket, head) {
            const pathname = url.parse(request.url).pathname;
            if (pathname === '/childNode') {
                childNodeWebsocket.handleUpgrade(request, socket, head, function done(ws) {
                    childNodeWebsocket.emit('connection', ws, request)
                })
            } else if (pathname.indexOf('/socket.io') > -1) {
                return;
            } else {
                socket.destroy();
            }
        });
        const childNodeBindIP = config.childNodes.ip || config.bindip;
        childNodeServer.listen(config.childNodes.port,childNodeBindIP,function(){
            console.log(lang.Shinobi+' - CHILD NODE SERVER : '+childNodeBindIP + ':' + config.childNodes.port);
        });
        s.debugLog('childNodeWebsocket.attach(childNodeServer)')
        //send data to child node function
        s.cx = function(data,connectionId,senderObject){
            // if(senderObject){
            //     data.sentFrom = senderObject.id;
            //     childNodesConnectionIndex[y].sendJson(data)
            // }else{
                childNodesConnectionIndex[y].sendJson(data)
            // }
        }
        //child Node Websocket
        childNodeWebsocket.on('connection', function (client, req) {
            //functions for dispersing work to child servers;
            const connectionId = s.gid(10);
            client.id = connectionId;
            function onConnection(d){
                const data = JSON.parse(d);
                const childNodeKeyAccepted = config.childNodes.key.indexOf(data.socketKey) > -1;
                if(!client.shinobiChildAlreadyRegistered && data.f === 'init' && childNodeKeyAccepted){
                    const connectionAddress = initiateDataConnection(client,req,data);
                    childNodesConnectionIndex[connectionId] = client;
                    client.removeListener('message',onConnection)
                    client.on('message',(d) => {
                        const data = JSON.parse(d);
                        onWebSocketData(client,data)
                    })
                }else{
                    client.destroy()
                }
            }
            client.on('message',onConnection)
            client.on('disconnect',() => {
                onDataConnectionDisconnect(client, req)
            })
        })
    }else
    //setup Child for childNodes
    if(config.childNodes.enabled === true && config.childNodes.mode === 'child' && config.childNodes.host){
        const {
            initiateConnectionToMasterNode,
            onDisconnectFromMasterNode,
            onDataFromMasterNode,
        } = require('./childNode/childUtils.js')(s,config,lang,app,io)
        s.connectedToMasterNode = false;
        const childIO = createWebSocketClient('ws://'+config.childNodes.host,{
            onMessage: onDataFromMasterNode
        })
        function sendDataToMasterNode(data){
            x.socketKey = config.childNodes.key;
            childIO.send(JSON.stringify(data));
        }
        s.cx = sendDataToMasterNode;
        s.tx = function(x,y){
            sendDataToMasterNode({f:'s.tx',data:x,to:y})
        }
        s.userLog = function(x,y){
            sendDataToMasterNode({f:'s.userLog',mon:x,data:y})
        }
        s.queuedSqlCallbacks = {}
        s.sqlQuery = function(query,values,onMoveOn){
            var callbackId = s.gid()
            if(!values){values=[]}
            if(typeof values === 'function'){
                var onMoveOn = values;
                var values = [];
            }
            if(typeof onMoveOn === 'function')s.queuedSqlCallbacks[callbackId] = onMoveOn;
            sendDataToMasterNode({f:'sql',query:query,values:values,callbackId:callbackId});
        }
        s.knexQuery = function(options,onMoveOn){
            var callbackId = s.gid()
            if(typeof onMoveOn === 'function')s.queuedSqlCallbacks[callbackId] = onMoveOn;
            sendDataToMasterNode({f:'knex',options:options,callbackId:callbackId});
        }
        childIO.on('connect', function(){
            initiateConnectionToMasterNode()
        })
        childIO.on('disconnect',function(){
            onDisconnectFromMasterNode()
        })
    }
}
