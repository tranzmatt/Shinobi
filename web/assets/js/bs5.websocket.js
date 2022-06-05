var mainSocket = {}
var websocketPath = checkCorrectPathEnding(location.pathname) + 'socket.io'
var websocketQuery = {}
if(location.search === '?p2p=1'){
    window.machineId = location.pathname.split('/')[2]
    websocketPath = '/socket.io'
    websocketQuery.machineId = machineId
}
var onInitWebsocketFunctions = []
function onInitWebsocket(theAction){
    onInitWebsocketFunctions.push(theAction)
}
var onWebSocketEventFunctions = []
function onWebSocketEvent(theAction){
    onWebSocketEventFunctions.push(theAction)
}
$(document).ready(function(){
    mainSocket = io(location.origin,{
        path: websocketPath,
        query: websocketQuery
    })
    mainSocket.f = function(data){
        if(!data.ke)data.ke = $user.ke;
        if(!data.uid)data.uid = $user.uid;
        console.log('Sending Data',data)
        return mainSocket.emit('f',data)
    }
    mainSocket.on('ping', function(){
        mainSocket.emit('pong',{beat:1})
    })
    mainSocket.on('connect',function (d){
        console.log('Connected to Websocket!')
        if(location.search === '?p2p=1'){
            mainSocket.emit('p2pInitUser',{
              user: {
                ke: $user.ke,
                mail: $user.mail,
                auth_token: $user.auth_token,
                details: $user.details,
                uid: $user.uid,
            },
            machineId: machineId
          })
        }else{
            mainSocket.f({
                f: 'init',
                ke: $user.ke,
                auth: $user.auth_token,
                uid: $user.uid
            })
        }
    })
    mainSocket.on('f',function (d){
        switch(d.f){
            case'init_success':
                console.log('Authenticated to Websocket!')
                $.each(onInitWebsocketFunctions,function(n,theAction){
                    theAction(d)
                })
            break;
        }
        $.each(onWebSocketEventFunctions,function(n,theAction){
            theAction(d)
        })
    })
})
