module.exports = function(s,config,lang,io){
    function checkStaticUser(staticUser){
        return new Promise((resolve,reject) => {
            const whereQuery = {
                mail: staticUser.mail
            }
            if(staticUser.ke)whereQuery.ke = staticUser.ke
            s.knexQuery({
                action: "select",
                columns: "mail,ke,uid",
                table: "Users",
                where: whereQuery,
                limit: 1,
            },function(err,users) {
                resolve(users[0])
            })
        })
    }
    function createStaticUser(staticUser){
        // cannot create sub-accounts in this way
        return new Promise((resolve,reject) => {
            const defaultDetailsColumn = {
                "factorAuth":"0",
                "size": staticUser.diskLimit || staticUser.size,
                "days":"",
                "event_days":"",
                "log_days":"",
                "max_camera":  staticUser.cameraLimit || staticUser.max_camera,
                "permissions":"all",
                "edit_size":"1",
                "edit_days":"1",
                "edit_event_days":"1",
                "edit_log_days":"1",
                "use_admin":"1",
                "use_aws_s3":"1",
                "use_whcs":"1",
                "use_sftp":"1",
                "use_webdav":"1",
                "use_discordbot":"1",
                "use_ldap":"1",
                "aws_use_global":"0",
                "b2_use_global":"0",
                "webdav_use_global":"0"
            }
            const insertQuery = {
                ke: staticUser.ke || s.gid(),
                uid: staticUser.uid || s.gid(),
                mail: staticUser.mail,
                pass: s.createHash(staticUser.initialPassword || staticUser.pass || s.gid()),
                details: JSON.stringify(defaultDetailsColumn)
            }
            s.knexQuery({
                action: "insert",
                table: "Users",
                insert: insertQuery
            },function(err,users) {
                resolve(insertQuery)
            })
        })
    }
    async function checkForStaticUsers(){
        if(config.staticUsers){
            for (let i = 0; i < config.staticUsers.length; i++) {
                const staticUser = config.staticUsers[i]
                s.debugLog(`Checking Static User...`,staticUser.mail)
                const userExists = await checkStaticUser(staticUser)
                if(!userExists){
                    s.debugLog(`Static User does not exist, creating...`)
                    await createStaticUser(staticUser)
                }else{
                    s.debugLog(`Static User exists!`)
                }
            }
        }
    }
    return {
        checkStaticUser,
        createStaticUser,
        checkForStaticUsers,
    }
}
