$(document).ready(function(){
    var mqttList = $('#mqttclient_list')
    function drawMqttLsitRow(row,number){
        var html = `<div class="d-flex flex-row mqtt-list-row">
            <div class="flex-grow-1">
                <input class="form-control form-control-sm" mqtt-param="host" value="${row.host || ''}">
            </div>
            <div>
                <input class="form-control form-control-sm" mqtt-param="subKey" value="${row.subKey || ''}">
            </div>
            <div>
                <select multiple class="form-control form-control-sm" mqtt-param="type">
                    ${createOptionHtml({
                        value: 'plain',
                        label: lang['Plain'],
                        selected: row.type === 'plain',
                    })}
                    ${createOptionHtml({
                        value: 'frigate',
                        label: lang['Frigate'],
                        selected: row.type === 'frigate',
                    })}
                </select>
            </div>
            <div>
                <select multiple class="form-control form-control-sm" mqtt-param="monitors">
                    <option value="${lang['All Monitors']}"></option>
                    <optgroup label="${lang.Monitors}">${buildMonitorsListSelectFieldHtml(row.monitors || [])}</optgroup>
                </select>
            </div>
        </div>`
        return html
    }
    accountSettings.onLoadFields(function(theForm){
        var mqttClientList = $user.details.mqttclient_list ? $user.details.mqttclient_list : []
        mqttList.empty()
        $.each(mqttClientList,function(n,row){
            mqttList.append(drawMqttLsitRow(row,n))
        })
    })
    accountSettings.onSaveFields(function(theForm){
        var mqttClientList = []
        mqttList.find('.mqtt-list-row').each(function(n,v){
            var el = $(v)
            var rowFields = {}
            el.find('[mqtt-param]').each(function(nn,param){
                var paramEl = $(param)
                var theKey = paramEl.attr('mqtt-param')
                var value = paramEl.val()
                rowFields[theKey] = value
            })
            mqttClientList.push(rowFields)
        })
        theForm.details.mqttclient_list = mqttClientList
    })
})
