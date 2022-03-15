const fetch = require('node-fetch');
module.exports = (config,lang,p2pClientConnections) => {
    const parseJSON = function(string){
        var parsed = string
        try{
            parsed = JSON.parse(string)
        }catch(err){

        }
        return parsed
    }
    const createQueryStringFromObject = function(obj){
        var queryString = ''
        var keys = Object.keys(obj)
        keys.forEach(function(key){
            var value = obj[key]
            queryString += `&${key}=${value}`
        })
        return queryString
    }
    const doRequest = function(url,method,data,outboundMessage,callback,onDataReceived,headers){
        const requestEndpoint = `${config.sslEnabled ? `https` : 'http'}://localhost:${config.sslEnabled ? config.ssl.port : config.port}` + url
        const urlParts = url.split('/');
        const forceStream = urlParts[2] === 'img'
        const hasCallback = typeof callback === 'function' && !forceStream;
        if(method === 'GET' && data){
            requestEndpoint += '?' + createQueryStringFromObject(data)
        }
        console.log()
        const theRequest = fetch(requestEndpoint,{
            headers: Object.assign({ "Content-Type": "application/json" },headers),
            method: method,
            body: method !== 'GET' ? (data ? JSON.stringify(data) : null) : null
        });
        outboundMessage('httpHeaders',{
            headers: headers,
        })
        theRequest.then((resp) => {
            const buffers = []
            resp.body.on('data', (chunk) => {
                onDataReceived(chunk)
                if(hasCallback)buffers.push(chunk)
            })

            if(hasCallback){
               resp.body.on('end', () => {
                   // end of stream
                   const allBuffers = Buffer.concat(buffers).toString()
                   let newBody = allBuffers;
                   try{
                       method !== 'GET' ? (data ? data : null) : null;
                       newBody = JSON.parse(allBuffers);
                   }catch(err){
                       newBody = allBuffers;
                   }
                   callback(null,newBody,resp)
                })
            }
        }).catch((err) => {
            console.error(err,data)
            callback(err,{})
        });
        // async function readOnData(){
        //     try {
        //         console.log(typeof theRequest)
        //         const response = await theRequest;
        //         for await (const chunk of response.body) {
        //             onDataReceived(chunk)
        //         }
        //     } catch (err) {
        //         console.error(err.stack);
        //     }
        // }
        // readOnData()
        return theRequest
    }
    const createShinobiSocketConnection = (connectionId) => {
        const masterConnectionToMachine = socketIOClient(`ws://localhost:${config.port}`, {transports:['websocket']})
        p2pClientConnections[connectionId || p2pClientConnectionStaticName] = masterConnectionToMachine
        return masterConnectionToMachine
    }
    const killAllClientConnections = () => {
        Object.keys(p2pClientConnections).forEach((key) => {
            try{
                p2pClientConnections[key].disconnect()
            }catch(err){

            }
            setTimeout(() => {
                delete(p2pClientConnections[key])
            },1000)
        })
    }
    return {
        parseJSON,
        createQueryStringFromObject,
        doRequest,
        createShinobiSocketConnection,
        killAllClientConnections,
    }
}
