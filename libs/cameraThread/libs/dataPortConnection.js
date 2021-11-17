module.exports = function(jsonData,onConnected){
    const config = jsonData.globalInfo.config;
    const dataPortToken = jsonData.dataPortToken;
    const CWS = require('cws');
    const client = new CWS(`ws://localhost:${config.port}/dataPort`);
    console.log('readyState:', client.readyState);
    client.on('error', e => {
        console.error(e);
    });
    client.on('close', e => {
        console.log('The websocket was closed');
    });
    //
    // // Listen for messages & log them
    // client.on('message', message => {
    //   if ('string' !== typeof message) throw Error("Message could not be decoded");
    //   const received = JSON.parse(message);
    //   console.log('Message received:', received);
    // });
    client.on('open', () => {
        onConnected()
    });
    return client;
}
