const request = require('request')
module.exports = (s,config,lang,p2pClientConnections) => {
    const doRequest = function(url,method,data,callback,onDataReceived,headers){
        var requestEndpoint = `${config.sslEnabled ? `https` : 'http'}://localhost:${config.sslEnabled ? config.ssl.port : config.port}` + url
        if(method === 'GET' && data){
            requestEndpoint += '?' + createQueryStringFromObject(data)
        }
        s.debugLog(`requestEndpoint`,requestEndpoint)
        const theRequest = request(requestEndpoint,{
            headers: headers,
            method: method,
            json: method !== 'GET' ? (data ? data : null) : null,
            // timeout: 3000,
        }, typeof callback === 'function' ? (err,resp,body) => {
            // var json = parseJSON(body)
            if(err)s.debugLog(err,data)
            callback(err,body,resp)
        } : null)
        .on('data', onDataReceived);
        return theRequest
    }
    return {
        doRequest,
    }
}
