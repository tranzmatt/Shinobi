function createWebSocketServer(options){
    const WebSocket = require('cws');
    const theWebSocket = new WebSocket.Server(options ? options : {
        noServer: true
    });
    theWebSocket.broadcast = function(data) {
      theWebSocket.clients.forEach((client) => {
           try{
               client.sendData(data)
           }catch(err){
               // console.log(err)
           }
      })
    };
    return theWebSocket
}
module.exports = {
    createWebSocketServer,
}
