module.exports = function(s,config){
    const isMySQL = config.databaseType === 'mysql';
    function currentTimestamp(){
        return s.databaseEngine.fn.now()
    }
    async function addColumn(tableName,columns){
        try{
            columns.forEach(async (column) => {
                if(!column)return;
                await s.databaseEngine.schema.table(tableName, table => {
                    const action = table[column.type](column.name,column.length)
                    if(column.defaultTo){
                        action.defaultTo(column.defaultTo)
                    }
                })
            })
        }catch(err){
            if(err && err.code !== 'ER_DUP_FIELDNAME'){
                s.debugLog(err)
            }
        }
    }
    async function createTable(tableName,columns,onSuccess){
        try{
            await s.databaseEngine.schema.createTable(tableName, table => {
                columns.forEach((column) => {
                    if(!column)return;
                    const action = table[column.type](column.name,column.length)
                    if(column.defaultTo){
                        action.defaultTo(column.defaultTo)
                    }
                })
            })
            if(onSuccess)await onSuccess();
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
                    if(column.defaultTo){
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
        if(config.databaseType === 'mysql'){
            mySQLtail = ' ENGINE=InnoDB DEFAULT CHARSET=utf8'
            //add Presets table and modernize
            var createPresetsTableQuery = 'CREATE TABLE IF NOT EXISTS `Presets` (  `ke` varchar(50) DEFAULT NULL,  `name` text,  `details` text,  `type` varchar(50) DEFAULT NULL)'
            s.sqlQuery( createPresetsTableQuery + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
                if(config.databaseType === 'sqlite3'){
                    var aQuery = "ALTER TABLE Presets RENAME TO _Presets_old;"
                        aQuery += createPresetsTableQuery
                        aQuery += "INSERT INTO Presets (`ke`, `name`, `details`, `type`) SELECT `ke`, `name`, `details`, `type` FROM _Presets_old;COMMIT;DROP TABLE _Presets_old;"
                }else{
                    s.sqlQuery('ALTER TABLE `Presets` CHANGE COLUMN `type` `type` VARCHAR(50) NULL DEFAULT NULL AFTER `details`;',[],function(err){
                        if(err)console.error(err)
                    },true)
                }
            },true)
            //add Schedules table, will remove in future
            s.sqlQuery("CREATE TABLE IF NOT EXISTS `Schedules` (`ke` varchar(50) DEFAULT NULL,`name` text,`details` text,`start` varchar(10) DEFAULT NULL,`end` varchar(10) DEFAULT NULL,`enabled` int(1) NOT NULL DEFAULT '1')" + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
            },true)
            //add Timelapses and Timelapse Frames tables, will remove in future
            s.sqlQuery("CREATE TABLE IF NOT EXISTS `Timelapses` (`ke` varchar(50) NOT NULL,`mid` varchar(50) NOT NULL,`details` longtext,`date` date NOT NULL,`time` timestamp NOT NULL,`end` timestamp NOT NULL,`size` int(11)NOT NULL)" + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
            },true)
            s.sqlQuery("CREATE TABLE IF NOT EXISTS `Timelapse Frames` (`ke` varchar(50) NOT NULL,`mid` varchar(50) NOT NULL,`details` longtext,`filename` varchar(50) NOT NULL,`time` timestamp NULL DEFAULT NULL,`size` int(11) NOT NULL)" + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
            },true)
            //Add index to Videos table
            s.sqlQuery('CREATE INDEX `videos_index` ON Videos(`time`);',[],function(err){
                if(err && err.code !== 'ER_DUP_KEYNAME'){
                    console.error(err)
                }
            },true)
            //Add index to Events table
            s.sqlQuery('CREATE INDEX `events_index` ON Events(`ke`, `mid`, `time`);',[],function(err){
                if(err && err.code !== 'ER_DUP_KEYNAME'){
                    console.error(err)
                }
            },true)
            //Add index to Logs table
            s.sqlQuery('CREATE INDEX `logs_index` ON Logs(`ke`, `mid`, `time`);',[],function(err){
                if(err && err.code !== 'ER_DUP_KEYNAME'){
                    console.error(err)
                }
            },true)
            //Add index to Monitors table
            s.sqlQuery('CREATE INDEX `monitors_index` ON Monitors(`ke`, `mode`, `type`, `ext`);',[],function(err){
                if(err && err.code !== 'ER_DUP_KEYNAME'){
                    console.error(err)
                }
            },true)
            //Add index to Timelapse Frames table
            s.sqlQuery('CREATE INDEX `timelapseframes_index` ON `Timelapse Frames`(`ke`, `mid`, `time`);',[],function(err){
                if(err && err.code !== 'ER_DUP_KEYNAME'){
                    console.error(err)
                }
            },true)
            //add Cloud Videos table, will remove in future
            s.sqlQuery('CREATE TABLE IF NOT EXISTS `Cloud Videos` (`mid` varchar(50) NOT NULL,`ke` varchar(50) DEFAULT NULL,`href` text NOT NULL,`size` float DEFAULT NULL,`time` timestamp NULL DEFAULT NULL,`end` timestamp NULL DEFAULT NULL,`status` int(1) DEFAULT \'0\',`details` text)' + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
            },true)
            //add Events Counts table, will remove in future
            s.sqlQuery('CREATE TABLE IF NOT EXISTS `Events Counts` (`ke` varchar(50) NOT NULL,`mid` varchar(50) NOT NULL,`details` longtext NOT NULL,`time` timestamp NOT NULL DEFAULT current_timestamp(),`end` timestamp NOT NULL DEFAULT current_timestamp(),`count` int(10) NOT NULL DEFAULT 1,`tag` varchar(30) DEFAULT NULL)' + mySQLtail + ';',[],function(err){
                if(err && err.code !== 'ER_TABLE_EXISTS_ERROR'){
                    console.error(err)
                }
                s.sqlQuery('ALTER TABLE `Events Counts`	ADD COLUMN `time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `details`;',[],function(err){
                    // console.error(err)
                },true)
            },true)
            //add Cloud Timelapse Frames table, will remove in future
            s.sqlQuery('CREATE TABLE IF NOT EXISTS `Cloud Timelapse Frames` (`ke` varchar(50) NOT NULL,`mid` varchar(50) NOT NULL,`href` text NOT NULL,`details` longtext,`filename` varchar(50) NOT NULL,`time` timestamp NULL DEFAULT NULL,`size` int(11) NOT NULL)' + mySQLtail + ';',[],function(err){
                if(err)console.error(err)
            },true)
        }

        await createTable('Files',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'name', length: 50, type: 'tinytext'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'details', type: 'text'},
            {name: 'status', type: 'int', length: 1, defaultTo: 0},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'time', type: 'timestamp'},
        ]);
        await createTable('Cloud Videos',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
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
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'archive', type: 'tinyint', length: 1, defaultTo: 0},
            {name: 'time', type: 'timestamp'},
        ]);
        await createTable('Events Counts',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'tag', length: 30, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'count', type: 'int', length: 10, defaultTo: 1},
            {name: 'time', type: 'timestamp'},
            {name: 'end', type: 'timestamp'},
        ]);
        await createTable('Cloud Timelapse Frames',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'href', type: 'text'},
            {name: 'filename', length: 50, type: 'string'},
            {name: 'time', type: 'timestamp'},
            {name: 'size', type: 'float', defaultTo: 0},
            {name: 'details', type: 'text'},
        ]);
        await createTable('API',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'uid', length: 50, type: 'string'},
            {name: 'ip', type: 'tinytext'},
            {name: 'code', length: 100, type: 'string'},
            {name: 'details', type: 'text'},
            {name: 'time', type: 'timestamp'},
        ]);
        await createTable('LoginTokens',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
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
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
            {name: 'ke', length: 50, type: 'string'},
            {name: 'mid', length: 50, type: 'string'},
            {name: 'info', type: 'text'},
            {name: 'time', type: 'timestamp', defaultTo: currentTimestamp()},
        ]);
        await createTable('Monitors',[
            isMySQL : {name: 'utf8', type: 'charset'} : null,
            isMySQL : {name: 'utf8_general_ci', type: 'collate'} : null,
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
        ]);
        // additional requirements for older installs

        await addColumn('Videos',[
            {
                name: 'archive',
                length: 1,
                type: 'tinyint',
                defaultTo: 0,
            },
            {
                name: 'objects',
                type: 'string',
            },
            {
                name: 'saveDir',
                length: 255,
                type: 'string',
                defaultTo: '',
            }
        ])
        await addColumn('Monitors',[
            {
                name: 'saveDir',
                length: 255,
                type: 'string',
                defaultTo: '',
            }
        ])
        await addColumn('Timelapse Frames',[
            {
                name: 'archive',
                length: 1,
                type: 'tinyint',
                defaultTo: 0,
            },
            {
                name: 'saveDir',
                length: 255,
                type: 'string',
                defaultTo: '',
            }
        ])
        await addColumn('Events',[
            {
                name: 'archive',
                length: 1,
                type: 'tinyint',
                defaultTo: 0,
            },
        ])
        await addColumn('Files',[
            {
                name: 'archive',
                length: 1,
                type: 'tinyint',
                defaultTo: 0,
            },
        ])
        delete(s.preQueries)
    }
}
