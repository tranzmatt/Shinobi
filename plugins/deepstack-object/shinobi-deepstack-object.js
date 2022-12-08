//
// Shinobi - DeepStack Object Detection Plugin
// Copyright (C) 2021 Elad Bar
//
// Base Init >>
const { spawn } = require('child_process');
const fs = require('fs');
const request = require("request");
const moment = require('moment');
const config = require('./conf.json');

let s = null;

const {
		workerData
	} = require('worker_threads');

const isWorker = workerData && workerData.ok === true;
const pluginBasePath = isWorker ? "pluginWorkerBase.js" : "pluginBase.js";

for(let i = 0; i < 2; i++) {
    try {
		s = require(`../${pluginBasePath}`)(__dirname, config);

	} catch(err) {
		console.log(err);

        s = null;
	}
}

if(s === null) {
    console.log(config.plug, `Plugin start has failed. ${pluginBasePath} was not found.`);
} else {
    if(!isWorker) {
        const {
            haltMessage,
            checkStartTime,
            setStartTime,
        } = require('../pluginCheck.js');
    
        if(!checkStartTime()) {
            console.log(haltMessage, new Date());
            s.disconnectWebSocket();
        }
    
        setStartTime();
    }
}
// Base Init />>

let detectorSettings = null;

const DELIMITER = "___";

const DETECTOR_TYPE_FACE = 'face';
const DETECTOR_TYPE_OBJECT = 'object';

const FACE_UNKNOWN = 'unknown';
const DEEPSTACK_API_KEY = 'api_key';

const DETECTOR_CONFIGUTATION = {
    face: {
        detectEndpoint: '/vision/face/recognize',
        startupEndpoint: '/vision/face/list',
        registerEndpoint: '/vision/face/register',
        deleteEndpoint: '/vision/face/delete',
        key: 'userid'
    },
    object: {
        detectEndpoint: '/vision/detection',
        startupEndpoint: '/vision/detection',
        key: 'label'
    }
}

const PROTOCOLS = {
    true: "https",
    false: "http"
};

const log = (logger, message) => {
    logger(`${moment().format()} [${config.plug}] ${message}`);
}

const logError = (message) => {
    log(console.error, message);
};

const logWarn = (message) => {
    log(console.warn, message);
};

const logInfo = (message) => {
    log(console.info, message);
};

const logDebug = (message) => {
    log(console.debug, message);
};

const postMessage = (data) => {
    const message = JSON.stringify(data);

	logInfo(message);
};

const initialize = () => {
    const deepStackProtocol = PROTOCOLS[config.deepStack.isSSL];
    
    const baseUrl = `${deepStackProtocol}://${config.deepStack.host}:${config.deepStack.port}/v1`;
    
    const detectionType = config.plug.split("-")[1].toLowerCase();
    const detectorConfig = DETECTOR_CONFIGUTATION[detectionType];
    const detectorConfigKeys = Object.keys(detectorConfig);
    
    detectorSettings = {
        type: detectionType,
        active: false,
        baseUrl: baseUrl,
        apiKey: config.deepStack.apiKey,
        faces: {
            shinobi: null,
            server: null,
            legacy: null
        },
        eventMapping: {
            "recompileFaceDescriptors": onRecompileFaceDescriptors
        }
	};
    
	detectorConfigKeys.forEach(k => detectorSettings[k] = detectorConfig[k]);

    const startupRequestData = getFormData(detectorSettings.startupEndpoint);
    
    request.post(startupRequestData, handleStartupResponse);
};

const handleStartupResponse = (err, res, body) => {
    try {
        if(err) {
            logError(`Failed to initialize ${config.plug} plugin, Error: ${err}`);

        } else {
            const response = JSON.parse(body);
            
            if(response.error) {
                detectorSettings.active = !response.error.endsWith('endpoint not activated');
            } else {
                detectorSettings.active = response.success;
            }

            logInfo(`${config.plug} loaded, Configuration: ${JSON.stringify(detectorSettings)}`);

            if (detectorSettings.active) {
                s.detectObject = detectObject;

                if(detectorSettings.type === DETECTOR_TYPE_FACE) {
                    onFaceListResult(err, res, body);
                }
            }  
        }
        
                  
    } catch(ex) {
        logError(`Failed to initialize ${config.plug} plugin, Error: ${ex}`);
    }
};

const registerFace = (serverFileName) => {
    const shinobiFileParts = serverFileName.split(DELIMITER);
    const faceName = shinobiFileParts[0];
    const image = shinobiFileParts[1];
    
    const frameLocation = `${config.facesFolder}${faceName}/${image}`;

    const imageStream = fs.createReadStream(frameLocation);
        
    const form = {
        image: imageStream,
        userId: serverFileName
    };
    
    const requestData = getFormData(detectorSettings.registerEndpoint, form);

    request.post(requestData, (err, res, body) => {
        if (err) {
            logError(`Failed to register face, Face: ${faceName}, Image: ${image}`);
        } else {
            logInfo(`Register face, Face: ${faceName}, Image: ${image}`);
        }
    });   
};

const unregisterFace = (serverFileName) => {
    const form = {
        userId: serverFileName
    };
    
    const requestData = getFormData(detectorSettings.deleteEndpoint, form);

    request.post(requestData, (err, res, body) => {
        if (err) {
            logError(`Failed to delete face, UserID: ${serverFileName}`);
        } else {
            logInfo(`Deleted face, UserID: ${serverFileName}`);
        }
    });  
};

const getServerFileNameByShinobi = (name, image) => {
    const fileName = `${name}${DELIMITER}${image}`;

    return fileName;
}

const compareShinobiVSServer = () => {
    const allFaces = detectorSettings.faces;
    const shinobiFaces = allFaces.shinobi;
    const serverFaces = allFaces.server;
    const compareShinobiVSServerDelayID = detectorSettings.compareShinobiVSServerDelayID || null;

    if (compareShinobiVSServerDelayID !== null) {
        clearTimeout(compareShinobiVSServerDelayID)
    }

    if(serverFaces === null || shinobiFaces === null) {
        detectorSettings.compareShinobiVSServerDelayID = setTimeout(compareShinobiVSServer, 5000);
        logWarn("AI Server not ready yet, will retry in 5 seconds");

        return;
    }

    const shinobiFaceKeys = Object.keys(shinobiFaces);    

    const shinobiFiles = shinobiFaceKeys.length === 0 ? 
                            [] :
                            shinobiFaceKeys
                                .map(faceName => {
                                    const value = shinobiFaces[faceName].map(image => getServerFileNameByShinobi(faceName, image));
                            
                                    return value;
                                })
                                .reduce((acc, item) => {
                                    console.log("acc: ", acc);
                                    console.log("item: ", item);

                                    const result = [...acc, ...item];
                                    
                                    return result;
                                });

    const facesToRegister = shinobiFiles.filter(f => !serverFaces.includes(f));
    const facesToUnregister = serverFaces.filter(f => !shinobiFiles.includes(f));

    if(facesToRegister.length > 0) {
        logInfo(`Registering the following faces: ${facesToRegister}`);
        facesToRegister.forEach(f => registerFace(f));
    }

    if(facesToUnregister.length > 0) {
        const allowUnregister =  detectorSettings.fullyControlledByFaceManager || false;

        if(allowUnregister) {
            logInfo(`Unregister the following faces: ${facesToUnregister}`);

            facesToUnregister.forEach(f => unregisterFace(f));    
        } else {        
            logInfo(`Skip unregistering the following faces: ${facesToUnregister}`);

            detectorSettings.faces.legacy = facesToUnregister;
        }    
    }
};

const processImage = (frameBuffer, d, tx, frameLocation, callback) => {
	if(!detectorSettings.active) {
        return;
    }

    try{
        const imageStream = fs.createReadStream(frameLocation);
        
        const form = {
			image: imageStream,
            min_confidence: 0.7
		};
		
		const requestData = getFormData(detectorSettings.detectEndpoint, form);
		
        const requestTime = getCurrentTimestamp();

		request.post(requestData, (err, res, body) => {
            if (!!res) {
                res.duration = getDuration(requestTime);
            }

            onImageProcessed(d, tx, err, res, body, frameBuffer);

            fs.unlinkSync(frameLocation);
		});        
	} catch(ex) {
		logError(`Failed to process image, Error: ${ex}`);

        if(fs.existsSync(frameLocation)) {
            fs.unlinkSync(frameLocation);
        }
	}

	callback();
};

const detectObject = (frameBuffer, d, tx, frameLocation, callback) => {
	if(!detectorSettings.active) {
        return;
    }

    const dirCreationOptions = {
        recursive: true
    };

    d.dir = `${s.dir.streams}${d.ke}/${d.id}/`;
    
    const filePath = `${d.dir}${s.gid(5)}.jpg`;

    if(!fs.existsSync(d.dir)) {
        fs.mkdirSync(d.dir, dirCreationOptions);
    }
    
    fs.writeFile(filePath, frameBuffer, function(err) {
        if(err) {
            return s.systemLog(err);
        }
    
        try {
            processImage(frameBuffer, d, tx, filePath, callback);

        } catch(ex) {
            logError(`Detector failed to parse frame, Error: ${ex}`);
        }
    });
};

const getCurrentTimestamp = () => {
    const currentTime = new Date();
    const currentTimestamp = currentTime.getTime();

    return currentTimestamp
};

const getDuration = (requestTime) => {
    const currentTime = new Date();
    const currentTimestamp = currentTime.getTime();

    const duration = currentTimestamp - requestTime;

    return duration;
};

const onFaceListResult = (err, res, body) => {
    try {
        const response = JSON.parse(body);

        const success = response.success;
        const facesArr = response.faces;
        const faceStr = facesArr.join(",");

        detectorSettings.faces.server = facesArr;

        if(success) {
            logInfo(`DeepStack loaded with the following faces: ${faceStr}`);            
        } else {
            logWarn(`Failed to connect to DeepStack server, Error: ${err}`);
        }
    } catch(ex) {
        logError(`Error while connecting to DeepStack server, Error: ${ex} | ${err}`);
    }
};

const onImageProcessed = (d, tx, err, res, body, frameBuffer) => {
    const duration = !!res ? res.duration : 0;

    const result = [];
    
    try {
        if(err) {
            throw err;
        }
        
        const response = JSON.parse(body);

        const success = response.success;

        if(success) {
            const predictions = response.predictions;
    
            if(predictions !== null && predictions.length > 0) {
                const predictionDescriptons = predictions.map(p => getPredictionDescripton(p)).filter(p => !!p);

                result.push(...predictionDescriptons);

                if(predictionDescriptons.length > 0) {
                    const identified = predictionDescriptons.filter(p => p.tag !== FACE_UNKNOWN);
                    const unknownCount = predictionDescriptons.length - identified.length;
                    
                    if(unknownCount > 0) {
                        logInfo(`${d.id} detected ${unknownCount} unknown ${detectorSettings.type}s, Response time: ${duration} ms`);
                    }

                    if(identified.length > 0) {
                        const detectedObjectsStrArr = [];

                        if (detectorSettings.type === DETECTOR_TYPE_FACE) {
                            identified.forEach(f => detectedObjectsStrArr.push(`${f.tag} (${f.person}) [${(f.confidence * 100).toFixed(2)}]`));
                        } else {
                            identified.forEach(f => detectedObjectsStrArr.push(`${f.tag} [${(f.confidence * 100).toFixed(2)}]`));
                        }
                        
                        const detectedObjectsStr = detectedObjectsStrArr.join(", ");

                        logInfo(`${d.id} detected ${detectorSettings.type}s: ${detectedObjectsStr}, Response time: ${duration} ms`);
                    }

                    const isObjectDetectionSeparate = d.mon.detector_pam === '1' && d.mon.detector_use_detect_object === '1';
                    const width = parseFloat(isObjectDetectionSeparate && d.mon.detector_scale_y_object ? d.mon.detector_scale_y_object : d.mon.detector_scale_y);
                    const height = parseFloat(isObjectDetectionSeparate && d.mon.detector_scale_x_object ? d.mon.detector_scale_x_object : d.mon.detector_scale_x);

                    const eventData = {
                        f: 'trigger',
                        id: d.id,
                        ke: d.ke,
                        details: {
                            plug: config.plug,
                            name: d.id,
                            reason: detectorSettings.type,
                            matrices: objects,
                            imgHeight: width,
                            imgWidth: height,
                            time: duration
                        },
                        frame: frameBuffer          
                    };

                    tx(eventData);
                }
            }
        } 
    } catch(ex) {
        logError(`Error while processing image, Error: ${ex} | ${err},, Response time: ${duration} ms, Body: ${body}`);
    }

    return result
};

const getFormData = (endpoint, additionalParameters) => {
    const formData = {};

    if(detectorSettings.apiKey) {
        formData[DEEPSTACK_API_KEY] = detectorSettings.apiKey;
    }

    if(additionalParameters !== undefined && additionalParameters !== null) {
        const keys = Object.keys(additionalParameters);

        keys.forEach(k => formData[k] = additionalParameters[k]);
    }

    const requestData = {
        url: `${detectorSettings.baseUrl}${endpoint}`,
        time: true,
        formData: formData
    };

    return requestData;
};

const getPredictionDescripton = (prediction) => {
    if(prediction === undefined) {
        return null;
    }

    const tag = prediction[detectorSettings.key];

    const confidence = prediction.confidence ?? 0;
    const y_min = prediction.y_min ?? 0;
    const x_min = prediction.x_min ?? 0;
    const y_max = prediction.y_max ?? 0;
    const x_max = prediction.x_max ?? 0;
    const width = x_max - x_min;
    const height = y_max - y_min;

    const obj = {
        x: x_min,
        y: y_min,
        width: width,
        height: height,
        tag: tag,
        confidence: confidence
    };    

    if (detectorSettings.type === DETECTOR_TYPE_FACE) {
        const legacyFaces = detectorSettings.faces.legacy || [];

        if (legacyFaces.includes(tag)) {
            const matchingPersons = detectorSettings.registeredPersons.filter(p => tag.startsWith(p))
            obj.person = matchingPersons.length > 0 ? matchingPersons[0] : null;

        } else {
            const shinobiFileParts = tag.split(DELIMITER);
            obj.person = shinobiFileParts[0];
        }        
    }    

    return obj;
};

const onRecompileFaceDescriptors = (d) => {
    if(detectorSettings.faces.shinobi !== d.faces) {
        detectorSettings.faces.shinobi = d.faces;

        compareShinobiVSServer();
    }
};

s.MainEventController = (d,cn,tx) => {
    const handler = detectorSettings.eventMapping[d.f];

    if (handler !== undefined) {
        try {
            handler(d);              
        } catch (error) {                
            logError(`Failed to handle event ${d.f}, Error: ${error}`);
        } 
    }
}

initialize();
