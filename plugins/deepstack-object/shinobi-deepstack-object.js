//
// Shinobi - Tensorflow Plugin
// Copyright (C) 2016-2025 Elad Bar, Moe Alam
//
// Base Init >>
var fs = require('fs');
var config = require('./conf.json')
const request = require("request")
var s
const {
		workerData
	} = require('worker_threads');

if(workerData && workerData.ok === true){
	try{
		s = require('../pluginWorkerBase.js')(__dirname,config)
	}catch(err){
		console.log(err)
		try{
			s = require('./pluginWorkerBase.js')(__dirname,config)
		}catch(err){
			console.log(err)
			return console.log(config.plug,'WORKER : Plugin start has failed. pluginBase.js was not found.')
		}
	}
}else{
	try{
		s = require('../pluginBase.js')(__dirname,config)
	}catch(err){
		console.log(err)
		try{
			s = require('./pluginBase.js')(__dirname,config)
		}catch(err){
			console.log(err)
			return console.log(config.plug,'Plugin start has failed. pluginBase.js was not found.')
		}
	}

	const {
		haltMessage,
		checkStartTime,
		setStartTime,
	} = require('../pluginCheck.js')

	if(!checkStartTime()){
		console.log(haltMessage,new Date())
		s.disconnectWebSocket()
		return
	}
	setStartTime()
}
// Base Init />>

var deepStackHost = config.deepStack["host"]
var deepStackPort = config.deepStack["port"]
var deepStackIsSSL = config.deepStack["isSSL"]
var deepStackApiKey = config.deepStack["apiKey"]
var deepStackProtocol = deepStackIsSSL ? "https" : "http"

var baseUrl = `${deepStackProtocol}://${deepStackHost}:${deepStackPort}/v1`
var objectDetectionUrl = `${baseUrl}/vision/detection`

s.detectObject = function(buffer,d,tx,frameLocation,callback){
	var timeStart = new Date()
	var detectStuff = async function(frame){
		try{
			image_stream = fs.createReadStream(frame)

			const form = {
				"image":image_stream
			}

			if(deepStackApiKey) {
				form["api_key"] = deepStackApiKey
			}

			request.post({url:objectDetectionUrl, formData:form}, function(err,res,body){
				const responseDate = new Date()

				const responseTime = (responseDate.getTime() - timeStart.getTime());

				const response = JSON.parse(body)

				const success = response["success"]
				const predictions = response["predictions"]
				const mats = []

				const detected = []

				if(success) {
					predictions.forEach(function(v){
						const label = v["label"]
						const confidence = v["confidence"]
						const y_min = v["y_min"]
						const x_min = v["x_min"]
						const y_max = v["y_max"]
						const x_max = v["x_max"]
						const width = x_max - x_min
						const height = y_max - y_min

						detected.push(`${label}: ${confidence}`)

						mats.push({
							x: x_min,
							y: y_min,
							width: width,
							height: height,
							tag: label,
							confidence: confidence,
						})
					})
				}

				if(detected.length > 0) {
					detectedStr = detected.join(",")
				}

				const isObjectDetectionSeparate = d.mon.detector_pam === '1' && d.mon.detector_use_detect_object === '1'
				const width = parseFloat(isObjectDetectionSeparate  && d.mon.detector_scale_y_object ? d.mon.detector_scale_y_object : d.mon.detector_scale_y)
				const height = parseFloat(isObjectDetectionSeparate  && d.mon.detector_scale_x_object ? d.mon.detector_scale_x_object : d.mon.detector_scale_x)

				tx({
					f:'trigger',
					id:d.id,
					ke:d.ke,
					details:{
						plug:config.plug,
						name: `DeepStack-Object`,
						reason:'object',
						matrices:mats,
						imgHeight:width,
						imgWidth:height,
						time: responseTime
					}
				})
			})
		}catch(err){
			console.log(err)
		}
		callback()
	}

	if(frameLocation){
		detectStuff(frameLocation)
	}else{
		d.tmpFile=s.gid(5)+'.jpg'
		if(!fs.existsSync(s.dir.streams)){
			fs.mkdirSync(s.dir.streams);
		}

		d.dir=s.dir.streams+d.ke+'/'
		if(!fs.existsSync(d.dir)){
			fs.mkdirSync(d.dir);
		}

		d.dir=s.dir.streams+d.ke+'/'+d.id+'/'
		if(!fs.existsSync(d.dir)){
			fs.mkdirSync(d.dir);
		}

		fs.writeFile(d.dir+d.tmpFile,buffer,function(err){
			if(err) return s.systemLog(err);

			try{
				detectStuff(d.dir+d.tmpFile)
			}catch(error){
				console.error('Catch: ' + error);
			}
		})
	}
}
