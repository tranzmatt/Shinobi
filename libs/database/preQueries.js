module.exports = function(s,config){
    const isMySQL = config.databaseType === 'mysql';
    function currentTimestamp(){
        return s.databaseEngine.fn.now()
    }
    async function addColumn(tableName,columns){
        try{
            for (let i = 0; i < columns.length; i++) {
                const column = columns[i]
                if(!column)return;
                await s.databaseEngine.schema.table(tableName, table => {
                    const action = table[column.type](column.name,column.length)
                    if(column.defaultTo !== null && column.defaultTo !== undefined){
                        action.defaultTo(column.defaultTo)
                    }
                })
            }
        }catch(err){
            if(err && err.code !== 'ER_DUP_FIELDNAME'){
                s.debugLog(err)
            }
        }
    }
    async function createTable(tableName,columns,onSuccess){
        try{
            const exists = await s.databaseEngine.schema.hasTable(tableName)
            if (!exists) {
                await s.databaseEngine.schema.createTable(tableName, table => {
                    columns.forEach((column) => {
                        if(!column)return;
                        const action = table[column.type](column.name,column.length)
                        if(column.defaultTo !== null && column.defaultTo !== undefined){
                            action.defaultTo(column.defaultTo)
                        }
                    })
                })
                if(onSuccess)await onSuccess();
            }
        }catch(err){
            if(err && err.code !== 'ER_TABLE_EXISTS_ERROR'){
                s.debugLog(err)
            }
        }
    }
    async function alterTable(tableName,columns){
        try{
            await s.databaseEngine.schema.createTable(tableName, table => {
                columns.forEach((column) => {
                    if(!column)return;
                    const action = table[column.type](column.name,column.length)
                    if(column.defaultTo !== null && column.defaultTo !== undefined){
                        action.defaultTo(column.defaultTo)
                    }
                })
            })
        }catch(err){
            s.debugLog(err)
        }
    }
    s.preQueries = async function(){
        var knex = s.databaseEngine
        var mySQLtail = ''
        await createTable('Files',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'tinytext'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'details', type: 'text'},
            {name: 'status', type: 'int', length: 1, defaultTo: 0},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'time', type: 'timestamp'},
        ]);
        await createTable('Videos',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'ext', type: 'string', length: 10, defaultTo: 'mp4'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'status', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'objects', type: 'string'},
            {name: 'saveDir', length: 255, type: 'string'},
            {name: 'time', type: 'timestamp'},
            {name: 'end', type: 'timestamp'},
            {name: 'details', type: 'text'},
            // KEY `videos_index` (`time`)
            // CREATE INDEX `videos_index` ON Videos(`time`);
        ]);
        await createTable('Cloud Videos',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'href', length: 50, type: 'text'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'details', type: 'text'},
            {name: 'status', type: 'int', length: 1, defaultTo: 0},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'time', type: 'timestamp'},
            {name: 'end', type: 'timestamp'},
        ]);
        await createTable('Events',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'time', type: 'timestamp'},
            // KEY `events_index` (`ke`,`mid`,`time`)
            // CREATE INDEX `events_index` ON Events(`ke`, `mid`, `time`);
        ]);
        await createTable('Events Counts',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'tag', length: 30, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'count', type: 'int', length: 10, defaultTo: 1},
            {name: 'time', type: 'timestamp'},
            {name: 'end', type: 'timestamp'},
        ]);
        await createTable('Cloud Timelapse Frames',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'href', type: 'text'},
            {name: 'filename', length: 50, type: 'string'},
            {name: 'time', type: 'timestamp'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'details', type: 'text'},
        ]);
        await createTable('API',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'uid', length: 50, type: 'string'},
            {name: 'ip', type: 'tinytext'},
            {name: 'code', length: 100, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'time', type: 'timestamp'},
        ]);
        await createTable('LoginTokens',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'loginId', length: 255, type: 'string'},
            {name: 'type', length: 25, type: 'string'},
            {name: 'ke', length: 50, type: 'string'},
            {name: 'uid', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'string', defaultTo: 'Unknown'},
        ], async () => {
            await alterTable('LoginTokens',[
                {
                    name: 'loginId',
                    type: 'unique',
                },
            ])
        });
        await createTable('Logs',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'info', type: 'text'},
            {name: 'time', type: 'timestamp', defaultTo: currentTimestamp()},
            // KEY `logs_index` (`ke`,`mid`,`time`)
            // CREATE INDEX `logs_index` ON Logs(`ke`, `mid`, `time`);
        ]);
        await createTable('Monitors',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'string'},
            {name: 'shto', type: 'text'},
            {name: 'shfr', type: 'text'},
            {name: 'details', type: 'longtext'},
            {name: 'type', type: 'string', length: 25, defaultTo: 'h264'},
            {name: 'ext', type: 'string', length: 10, defaultTo: 'mp4'},
            {name: 'protocol', type: 'string', length: 10, defaultTo: 'rtsp'},
            {name: 'host', type: 'string', length: 100, defaultTo: '0.0.0.0'},
            {name: 'path', type: 'string', length: 100, defaultTo: '/'},
            {name: 'port', type: 'int', length: 8, defaultTo: 554},
            {name: 'fps', type: 'int', length: 8},
            {name: 'mode', type: 'string', length: 15},
            {name: 'width', type: 'int', length: 11},
            {name: 'height', type: 'int', length: 11},
            // KEY `monitors_index` (`ke`,`mode`,`type`,`ext`)
            // CREATE INDEX `monitors_index` ON Monitors(`ke`, `mode`, `type`, `ext`);
        ]);
        await createTable('Presets',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'string'},
            {name: 'type', length: 50, type: 'string'},
            {name: 'details', type: 'text'},
        ]);
        await createTable('Schedules',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'start', length: 10, type: 'string'},
            {name: 'end', length: 10, type: 'string'},
            {name: 'enabled', type: 'int', length: 1, defaultTo: 1},
        ]);
        await createTable('Timelapse Frames',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'filename', length: 50, type: 'string'},
            {name: 'time', type: 'timestamp'},
            {name: 'size', type: 'float', length: 11},
            {name: 'archive', length: 1, type: 'tinyint', defaultTo: 0},
            {name: 'saveDir', length: 255, type: 'string'},
            {name: 'details', type: 'text'},
            // KEY `timelapseframes_index` (`ke`,`mid`,`time`)
        ]);
        await createTable('Users',[
            isMySQL ? {name: 'utf8', type: 'charset'} : null,
            isMySQL ? {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'uid', length: 50, type: 'string'},
            {name: 'auth', length: 50, type: 'string'},
            {name: 'mail', length: 100, type: 'string'},
            {name: 'pass', length: 100, type: 'string'},
            {name: 'accountType', type: 'int', length: 1, defaultTo: 0},
            {name: 'details', type: 'longtext'},
            // UNIQUE KEY `mail` (`mail`)
        ]);

        // additional requirements for older installs
        await addColumn('Videos',[
            {name: 'archive', length: 1, type: 'tinyint', defaultTo: 0},
            {name: 'objects', type: 'string'},
            {name: 'saveDir', length: 255, type: 'string'},
        ])
        await addColumn('Monitors',[
            {name: 'saveDir', length: 255, type: 'string'},
        ])
        await addColumn('Timelapse Frames',[
            {name: 'archive', length: 1, type: 'tinyint', defaultTo: 0},
            {name: 'saveDir', length: 255, type: 'string'},
        ])
        await addColumn('Events',[
            {name: 'archive', length: 1, type: 'tinyint', defaultTo: 0},
        ])
        await addColumn('Files',[
            {name: 'archive', length: 1, type: 'tinyint', defaultTo: 0},
        ])
        delete(s.preQueries)
    }
}
