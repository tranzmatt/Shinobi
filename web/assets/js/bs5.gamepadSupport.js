var selectedController = 0;
var buttonLegend = {
    "0": "b",
    "1": "a",
    "2": "y",
    "3": "x",
    "4": "l",
    "5": "r",
    "6": "zl",
    "7": "zr",
    "8": "minus",
    "9": "plus",
    "10": "l_stick",
    "11": "r_stick",
    "12": "up",
    "13": "down",
    "14": "left",
    "15": "right",
}
var buttonLegendFunctions = {
    // B
    confirmButton: function(){

    },
    // L1
    backButton: function(){
        goBackOneTab()
    },
    // Left Stick
    leftStickMove: function(position){
        switch(tabTree.name){
            case'liveGrid':
                liveGridLeftStickController(position)
            break;
        }
    },
    // D-Pad UP
    openLiveGrid: function(){
        openTab('liveGrid')
    },
    // D-Pad Down
    openAllStreamsInLiveGrid: function(){
        openAllLiveGridPlayers()
    },
    // D-Pad Right
    openLogs: function(){
        openTab('logViewer')
    },
    // minus
    backHome: function(){
        goBackHome()
    },
    // plus
    refreshTab: function(){

    },
}
var lastState = {
    sticks: {
        left: {},
        right: {},
    }
}
var hasGP = false;
var repGP;
var stickBase = 2048
var stickMax = 4096
var deadZoneThreshold = 0.14
var outerDeadZone = 0.75
var stickMoveMinumum = 25

function canGame() {
   return "getGamepads" in navigator;
}

function convertStickAxisTo2048(value){
   var newVal = parseInt((stickMax - stickBase) * value + stickBase)
   return newVal
}

function convertStickReverseAxisTo2048(value){
   var newVal = parseInt(-value * stickBase) + stickBase
   return newVal
}

function getStickValues(gp,commandsToRun){
    for(var i = 0; i < 4; i += 2) {
        var label = i === 0 ? 'left' : 'right'
        var horizontal = gp.axes[i] * outerDeadZone
        var vertical = gp.axes[i + 1] * outerDeadZone
        var newH = parseFloat((horizontal * 100).toFixed(2))
        var newV = parseFloat((vertical * 100).toFixed(2))
        var horizontalMove = newH >= stickMoveMinumum ? 'r' : newH <= -stickMoveMinumum ? 'l' : 'c'
        var verticalMove = newV >= stickMoveMinumum ? 'd' : newV <= -stickMoveMinumum ? 'u' : 'c'
        if(
            horizontalMove !== lastState.sticks[label].h
        ){
            commandsToRun[`stick_${label}_h`] = horizontalMove
        }
        if(
            verticalMove !== lastState.sticks[label].v
        ){
            commandsToRun[`stick_${label}_v`] = verticalMove
        }
        lastState.sticks[label].h = horizontalMove
        lastState.sticks[label].v = verticalMove
    }
}

function getButtonValues(gp,commandsToRun){
    $.each(buttonLegend,function(code,key){
        if(gp.buttons[code] && gp.buttons[code].pressed){
            if(!lastState[key])commandsToRun[code] = true
            lastState[key] = true
        }else{
            if(lastState[key])commandsToRun[code] = false
            lastState[key] = false
        }
    })
}

function runControllerCommands(commandsToRun){
    var noChange = JSON.stringify(commandsToRun) === '{}'
    if(!noChange){
        console.log(commandsToRun,noChange)
        if(commandsToRun.stick_left_h)buttonLegendFunctions.leftStickMove(commandsToRun.stick_left_h)
        if(commandsToRun.stick_left_v)buttonLegendFunctions.leftStickMove(commandsToRun.stick_left_v)
    }
}

function reportOnProperGamepad() {
    try{
        var gp = navigator.getGamepads()[0];
        var commandsToRun = {}
        getButtonValues(gp,commandsToRun)
        getStickValues(gp,commandsToRun)
        runControllerCommands(commandsToRun)
    }catch(err){
        console.error(err.stack)
        stopReporting()
    }
}

var reportOnGamepad = reportOnProperGamepad
function startReporting(){
    if(hasGP){
        var gp = navigator.getGamepads()[0];
        repGP = window.setInterval(reportOnGamepad,25);
    }
}

function stopReporting(){
    window.clearInterval(repGP)
}

$(document).ready(function() {
   if(canGame()) {
       console.log('Controller Support Available!')
       $(window).on("gamepadconnected", function() {
           hasGP = true;
           console.log('Controller Connected! Reading...')
           startReporting();
       });

       $(window).on("gamepaddisconnected", function() {
           console.log('Controller Disconnected!')
           stopReporting()
       });

       $(window).focus(function() {
           startReporting()
       }).blur(function() {
           stopReporting()
       });
   }else{
       console.log('Controller Support NOT Available!')
   }
});
