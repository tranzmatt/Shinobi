var loginForm = $('#login-form')
var cachedLoginInfo = localStorage.getItem('ShinobiLogin_'+location.host)
var cachedMachineId = localStorage.getItem('ShinobiAuth_'+location.host)
function generateId(x){
    if(!x){x=10};var t = "";var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < x; i++ )
        t += p.charAt(Math.floor(Math.random() * p.length));
    return t;
}
function onSelectorChange(_this,parent){
    var el = $(_this)
    var theParam = el.attr('selector')
    var theValue = el.val()
    var theSelected = el.find('option:selected').text()
    parent.find(`.${theParam}_input`).hide()
    parent.find(`.${theParam}_${theValue}`).show()
    parent.find(`.${theParam}_text`).text(theSelected)
}
if(!cachedMachineId){
    cachedMachineId = generateId(20)
    localStorage.setItem('ShinobiAuth_'+location.host,cachedMachineId)
}
$(document).ready(function(){
    $('#machineID').val(cachedMachineId)
    $('[selector]').change(onSelectorChange).change();
})
loginForm.submit(function(e){
    $('#login-message').remove()
    var formValues = loginForm.serializeObject()
    if(formValues.remember){
        localStorage.setItem('ShinobiLogin_'+location.host,JSON.stringify({
            mail: formValues.mail,
            pass: formValues.pass,
            function: formValues.function
        }))
    }else{
        localStorage.removeItem('ShinobiLogin_'+location.host)
    }
    if(googleSignIn)googleSignOut();
})
if(cachedLoginInfo){
    cachedLoginInfo = JSON.parse(cachedLoginInfo)
    $.each(cachedLoginInfo,function(n,v){
        var el = loginForm.find('[name="'+n+'"]')
        if(el.attr('type') === 'checkbox'){
            el.prop('checked',true)
        }else{
            el.val(v)
        }
    })
    loginForm.find('[name="remember"]').prop('checked',true)
    loginForm.submit()
}
$('[name="function"]').change(function(){
    var removeClass='btn-danger btn-primary btn-success btn-warning'
    var addClass='btn-success'
    switch($(this).val()){
        case'streamer':
            addClass='btn-warning'
        break;
        case'admin':
            addClass='btn-primary'
        break;
        case'super':
            addClass='btn-danger'
        break;
    }
    $('#login-submit').removeClass(removeClass).addClass(addClass)
})
