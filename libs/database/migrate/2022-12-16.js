module.exports = async function(s,config){
    s.debugLog('Updating database to 2022-12-16')
    await addColumn('Monitors',[
        {name: 'tags', length: 255, type: 'string'},
    ])
}
