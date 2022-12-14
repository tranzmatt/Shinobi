const fs = require('fs');
const fsExtra = require("fs-extra");
const fileUpload = require('express-fileupload');
const { execPath } = require('process');

const MODULE_NAME = "face";

module.exports = (s, config, lang, app, io) => {
    const data = {
        faces: {}
    };
    
    const sendDataToConnectedSuperUsers = (message) => {
        return s.tx(message, '$');
    };

    const reloadFacesData = (notify = false) => {
        data.faces = {};

        fs.readdir(config.facesFolder, (err, folders) => {  
            folders.forEach((name) => {
                const faceDirectory = `${config.facesFolder}${name}`;
                const stats = fs.statSync(faceDirectory);
        
                if(stats.isDirectory()) {
                    try {
                        data.faces[name] = fs.readdirSync(faceDirectory);
                        
                    } catch (ex) {
                        console.error(`Failed to load faces and images, Error: ${ex}`);
                    }                    
                }
            });

            const message = {
                f: 'recompileFaceDescriptors',
                faces: data.faces,
                path: config.facesFolder
            };  

            sendDataToConnectedSuperUsers(message);
                
            s.sendToAllDetectors(message);
        });
    };

    const notifyImageUploaded = (name, image, authUser) => {
        const endpoint = `${name}/image/${image}`;
        const fileLink = getUrl(endpoint, authUser);

        sendDataToConnectedSuperUsers({
            f:`${MODULE_NAME}ImageUploaded`,
            faceName: name,
            fileName: image,
            url: fileLink
        });
    };

    const notifyContentDeleted = (name, image = null) => {
        const isImageDeleted = image !== undefined && image !== null;
        const deleteDescription = isImageDeleted ? "Image" : "Folder";

        const message = {
            f: `${MODULE_NAME}${deleteDescription}Deleted`,
            faceName: name
        }

        if(isImageDeleted) {
            message["fileName"] = image
        }

        sendDataToConnectedSuperUsers(message);
    };

    const getUrl = (endpoint, authUser = ":auth") => {
        const url = `${config.webPaths.superApiPrefix}${authUser}/${MODULE_NAME}${endpoint}`;

        return url;
    };

    const getImagePath = (name, image) => {
        const path = `${getFacePath(name)}/${image}`;

        return path;
    };

    const getFacePath = (name) => {
        const path = `${config.facesFolder}${name}`;

        return path;
    };

    const checkFile = (file, name, authUser) => {
        const fileName = file.name;
        const fileParts =  fileName.split(".");
        const fileExt = fileParts[fileParts.length - 1];
        const allowedExtensions = ["jpeg", "jpg", "png"];
        const canUpload = allowedExtensions.includes(fileExt);
        const result = canUpload ? fileName : null;

        if(canUpload) {
            const facePath = getFacePath(name);
            const imagePath = getImagePath(name, fileName);

            if(!fs.existsSync(facePath)){
                fs.mkdirSync(facePath);
            }
            
            file.mv(imagePath, function(err) {
                if(err) {
                    console.error(`Failed to store image in ${imagePath}, Error: ${err}`);
                } else {
                    notifyImageUploaded(name, fileName, authUser);
                }                        
            });
        }        

        return result;
    };

    const registerDeleteEndpoint = (endpoint, handler) => {
        const url = getUrl(endpoint);

        app.delete(url, (req, res) => {
            s.superAuth(req.params, superAuthResponse => {
                handler(req, res, superAuthResponse);
            }, res, req);
        });
    };

    const registerGetEndpoint = (endpoint, handler) => {
        const url = getUrl(endpoint);

        app.get(url, (req, res) => {
            s.superAuth(req.params, superAuthResponse => {
                handler(req, res, superAuthResponse);
            }, res, req);
        });
    };

    const registerPostEndpoint = (endpoint, handler, isFileUpload = false) => {
        const url = getUrl(endpoint);

        if(isFileUpload) {
            app.post(url, fileUpload(), (req, res) => {
                s.superAuth(req.params, superAuthResponse => {
                    handler(req, res, superAuthResponse);
                }, res, req);
            });
        } else {
            app.post(url, (req, res) => {
                s.superAuth(req.params, superAuthResponse => {
                    handler(req, res, superAuthResponse);
                }, res, req);
            });            
        }
    };

    const handleGetFaces = (req, res, superAuthResponse) => {        
        res.json({
            ok: true,
            faces: data.faces
        });
    };

    const handleGetImage = (req, res, superAuthResponse) => {  
        const imagePath = getImagePath(req.params.name, req.params.image);

        if(fs.existsSync(imagePath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            fs.createReadStream(imagePath).pipe(res);

        } else {
            res.json({
                ok: false,
                msg: lang['File Not Found']
            });
        }      
    };

    const handleDeleteImage = (req, res, superAuthResponse) => {   
        const name = req.params.name; 
        const image = req.params.image; 

        const imagePath = getImagePath(name, image);

        if(fs.existsSync(imagePath)) {
            fs.rm(imagePath,() => {
                reloadFacesData(true);

                console.info(`Delete image '${image}' of face '${name}' completed successfuly`);

                notifyContentDeleted(name, image);

                res.json({
                    ok: true,
                });
            });

        } else {
            res.json({
                ok: false,
            });
        }    
    };

    const handleDeleteFace = (req, res, superAuthResponse) => {    
        const name = req.params.name;    
        const facePath = getFacePath(name);
        
        if(fs.existsSync(facePath)) {
            fsExtra.emptyDirSync(facePath);

            fs.rmdir(facePath, () => {
                reloadFacesData(true);

                console.info(`Delete face '${name}' completed successfuly`);

                notifyContentDeleted(name);

                res.json({
                    ok: true,
                });
            });

        } else {
            res.json({
                ok: false,
            });
        }       
    };

    const handleMoveImage = (req, res, superAuthResponse) => {        
        const oldImagePath = getImagePath(req.params.name, req.params.image);
        const newImagePath = getImagePath(req.params.newName, req.params.image);
        const fileExists = fs.existsSync(oldImagePath);
        
        if(fileExists) {
            fs.rename(oldImagePath, newImagePath, (err, content) => {
                notifyContentDeleted(req.params.name, req.params.image);

                notifyImageUploaded(req.params.newName, req.params.newImage, req.params.auth);
                
                if(err) {
                    console.error(`Failed to move file from ${oldImagePath} to ${newImagePath}, Error: ${err}`);
                } else {
                    reloadFacesData(true);

                    console.info(`Handle image move completed successfuly, From: ${oldImagePath}, To: ${newImagePath}`);
                }                
            });
        } else {
            console.error(`Handle image move failed file '${oldImagePath}' does not exists`);
        }
        
        res.json({
            ok: fileExists,
        });
    };

    const handleImageUpload = (req, res, superAuthResponse) => {
        const fileKeys = Object.keys(req.files || {});
        
        if(fileKeys.length == 0){
            return res.status(400).send('No files were uploaded.');
        }            
        
        fileKeys.forEach(key => {
            const file = req.files[key];

            try {
                const files = file instanceof Array ? [...file] : [file];

                const uploaded = files.map(f => checkFile(f, req.params.name, req.params.auth));

                reloadFacesData(true);

                const responseData = {
                    ok: true,
                    filesUploaded: uploaded
                };

                console.info(`Handle image uploading completed successfuly, Data: ${responseData}`);

                res.json(responseData);
            } catch(err) {
                console.error(`Failed to upload file ${file}, Error: ${err}`);

                res.json({
                    ok: false
                });
            }
        });        
    }

    const createDirectory = () => {
        if(!config.facesFolder) {
            config.facesFolder = `${s.mainDirectory}/faces/`;
        }
    
        config.facesFolder = s.checkCorrectPathEnding(config.facesFolder);
    
        if(!fs.existsSync(config.facesFolder)){
            fs.mkdirSync(config.facesFolder)
        }
    };

    const onProcessReady = (d) => {
        reloadFacesData();
    };

    const initialize = () => {
        if(!config.enableFaceManager) {
            return;
        }

        createDirectory();
        
        registerGetEndpoint('s', handleGetFaces);
        registerGetEndpoint('/:name/image/:image', handleGetImage);

        registerDeleteEndpoint('/:name', handleDeleteFace);
        registerDeleteEndpoint('/:name/image/:image', handleDeleteImage);

        registerPostEndpoint('/:name', handleImageUpload, () => fileUpload());
        registerPostEndpoint('/:name/image/:image/move/:newName', handleMoveImage);
        
        s.onProcessReadyExtensions.push(onProcessReady);
    };
    
    initialize();
}
