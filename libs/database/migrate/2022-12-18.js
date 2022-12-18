module.exports = async function(s,config){
    s.debugLog('Updating database to 2022-12-18')
    const {
        addColumn,
    } = require('../utils.js')(s,config)
    await addColumn('Monitors',[
        {name: 'tags', length: 500, type: 'string'},
    ])
}
