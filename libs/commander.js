const { Worker } = require('worker_threads');
module.exports = function(s,config,lang,app){
    const fetch = require('node-fetch')
    const { modifyConfiguration, getConfiguration } = require('./system/utils.js')(config)
    let customerServerList = !!config.p2pServerList;
    var runningWorker;
    config.machineId = config.p2pApiKey + '' + config.p2pGroupId
    config.p2pTargetAuth = config.p2pTargetAuth || s.gid(30)
    if(!config.workerStreamOutHandlers){
        config.workerStreamOutHandlers = [
          'Base64',
          'FLV',
          'MP4',
        ];
    }
    if(!customerServerList){
        config.p2pServerList = {
            "vancouver-1-v2": {
                name: 'Vancouver-1',
                host: 'p2p-vancouver-1.shinobi.cloud',
                v2: true,
                p2pPort: '81',
                webPort: '80',
                chartPort: '82',
                maxNetworkSpeed: {
                    up: 5000,
                    down: 5000,
                    shared: true
                },
                location: {
                    lat: 49.284966,
                    lon: -123.1140607
                }
            },
            "toronto-1-v2": {
                name: 'Toronto-1',
                host: 'p2p-toronto-1.shinobi.cloud',
                v2: true,
                p2pPort: '81',
                webPort: '80',
                chartPort: '82',
                maxNetworkSpeed: {
                    up: 5000,
                    down: 5000,
                    shared: true
                },
                location: {
                    lat: 43.644773,
                    lon: -79.3862837
                }
            },
            "paris-1-v2": {
                name: 'Paris-1',
                host: 'p2p-paris-1.shinobi.cloud',
                v2: true,
                p2pPort: '81',
                webPort: '80',
                chartPort: '82',
                maxNetworkSpeed: {
                    up: 200,
                    down: 200,
                    shared: true
                },
                location: {
                    lat: 48.873877,
                    lon: 2.295533
                }
            }
        }
        // get latest
        fetch('https://cdn.shinobi.video/configs/p2pServers.js')
            .then(res => res.text())
            .then((text) => {
                try{
                    eval(`config.p2pServerList = ` + text)
                }catch(err){
                    s.debugLog(err)
                }
            });
    }
    if(!config.p2pHostSelected)config.p2pHostSelected = 'paris-1'
    const p2pServerKeys = Object.keys(config.p2pServerList)
    const filteredList = {}
    p2pServerKeys.forEach((keyName) => {
        const connector = config.p2pServerList[keyName]
        if(connector.v2 === !!config.useBetterP2P){
            filteredList[keyName] = connector;
        }
    })
    config.p2pServerList = filteredList;
    const stopWorker = () => {
        if(runningWorker){
            runningWorker.postMessage({
                f: 'exit'
            })
        }
    }
    const startWorker = () => {
        stopWorker()
        // set the first parameter as a string.
        const pathToWorkerScript = __dirname + `/commander/${config.useBetterP2P ? 'workerv2' : 'worker'}.js`
        const workerProcess = new Worker(pathToWorkerScript)
        workerProcess.on('message',function(data){
            switch(data.f){
                case'debugLog':
                    s.debugLog(...data.data)
                break;
                case'systemLog':
                    s.systemLog(...data.data)
                break;
            }
        })
        setTimeout(() => {
            workerProcess.postMessage({
                f: 'init',
                config: config,
                lang: lang
            })
        },2000)
        // workerProcess is an Emitter.
        // it also contains a direct handle to the `spawn` at `workerProcess.spawnProcess`
        return workerProcess
    }
    const beginConnection = () => {
        if(config.p2pTargetGroupId && config.p2pTargetUserId){
            runningWorker = startWorker()
        }else{
            s.knexQuery({
                action: "select",
                columns: "ke,uid",
                table: "Users",
                where: [],
                limit: 1
            },(err,r) => {
                const firstUser = r[0]
                config.p2pTargetUserId = firstUser.uid
                config.p2pTargetGroupId = firstUser.ke
                runningWorker = startWorker()
            })
        }
    }
    if(config.p2pEnabled){
        beginConnection()
    }
    /**
    * API : Superuser : Log delete.
    */
    app.post(config.webPaths.superApiPrefix+':auth/p2p/save', function (req,res){
        s.superAuth(req.params,async (resp) => {
            const response = {ok: true};
            const form = s.getPostData(req,'data',true)
            form.p2pEnabled = form.p2pEnabled === '1' ? true : false
            config = Object.assign(config,form)
            const currentConfig = await getConfiguration()
            const configError = await modifyConfiguration(Object.assign(currentConfig,form))
            if(configError)s.systemLog(configError)
            setTimeout(() => {
                if(form.p2pEnabled){
                    s.systemLog('Starting P2P')
                    beginConnection()
                }else{
                    s.systemLog('Stopping P2P')
                    stopWorker()
                }
            },2000)
            s.closeJsonResponse(res,response)
        },res,req)
    })
}
