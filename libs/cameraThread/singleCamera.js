
const fs = require('fs')
const spawn = require('child_process').spawn
// fs.unlinkSync('/home/Shinobi/test.log')
var writeToStderr = function(text){
  // fs.appendFileSync('/home/Shinobi/test.log',text + '\n','utf8')
}
process.send = process.send || function () {};
process.on('uncaughtException', function (err) {
    writeToStderr('Uncaught Exception occured!');
    writeToStderr(err.stack);
});
// [CTRL] + [C] = exit
process.on('SIGINT', function() {
  cameraProcess.kill('SIGTERM')
});

if(!process.argv[2] || !process.argv[3]){
    return writeToStderr('Missing FFMPEG Command String or no command operator')
}
var jsonData = JSON.parse(fs.readFileSync(process.argv[3],'utf8'))
const ffmpegAbsolutePath = process.argv[2].trim()
const ffmpegCommandString = jsonData.cmd
const rawMonitorConfig = jsonData.rawMonitorConfig
const stdioPipes = jsonData.pipes || []
var newPipes = []
var stdioWriters = [];

for(var i=0; i < stdioPipes; i++){
    switch(i){
      case 3:
        if(rawMonitorConfig.details.detector_pam === '1'){
          newPipes.push('pipe')
          stdioWriters[i] = fs.createWriteStream(null, {fd: i});
        }else{
          stdioWriters[i] = fs.createWriteStream(null, {fd: i});
          newPipes.push(stdioWriters[i])
        }
      break;
      default:
        stdioWriters[i] = fs.createWriteStream(null, {fd: i});
        newPipes.push(stdioWriters[i])
      break;
    }
}
var cameraProcess = spawn(ffmpegAbsolutePath,ffmpegCommandString,{detached: true,stdio:newPipes})
setTimeout(function(){
  writeToStderr('Start Process Now')
  try{
    const attachDetector = require(__dirname + '/detector.js')(jsonData,stdioWriters[3])
    attachDetector(cameraProcess)
  }catch(err){
    writeToStderr(err.stack)
  }
},3000)
cameraProcess.on('close',()=>{
  process.exit();
})
