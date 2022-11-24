var helpingHand = null
function drawHelpingHand(){
    if(!helpingHand){
        var html = `<div id="helping-hand"><i class="fa fa-3x fa-hand-pointer-o"></i></div>`
        $('body').append(html)
        helpingHand = $('#helping-hand')
    }
}
function removeHelpingHand(){
    if(helpingHand){
        helpingHand.fadeOut(2000)
        helpingHand.remove()
        helpingHand = null
    }
}
async function typeWriteInField(txt,fieldTarget){
    var speed = 100;
    var element = $(fieldTarget)[0]
    for (let i = 0; i < txt.length; i++) {
        element.value += txt.charAt(i);
        await setPromiseTimeout(speed);
    }
}
async function playHelpingHandShow(showId){
    drawHelpingHand()
    var selectedShow = helpingHandShows[showId]
    var playlist = selectedShow.playlist
    for (let i = 0; i < playlist.length; i++) {
        var movement = playlist[i];
        var waitTime = movement.time * 1000
        await setPromiseTimeout(waitTime);
        var handPos = movement.handPos
        var handPosCss = handPos
        if(handPos.el){
            var handElOffset = $(handPos.el).offset()
            handElOffset.top += 30
            handPosCss = handElOffset
        }
        console.log(handPosCss)
        var cmd = movement.cmd
        helpingHand.css(handPosCss)
        if(cmd){
            await setPromiseTimeout(1500);
            try{
                await cmd();
            }catch(err){
                console.error(err)
            }
        }
    }
    await setPromiseTimeout(3000);
    removeHelpingHand()
}
$(document).ready(function(e){
    playHelpingHandShow("test-show")
})
