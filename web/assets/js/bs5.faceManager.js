$(document).ready(() => {
    const faceListRows = $('#faceListRows');

    const getUrl = (endpoint) => {
        const url = `${moduleData.baseUrl}${endpoint}`;

        return url;
    };

    const notify = (text, isError = false) => {
        const notification = {
            type: isError ? 'warning' : 'info',
            title: isError ? lang.operationSuccess : lang.operationFailed,
            text: text,
        };

        new PNotify(notification);

        httpGetFaceImages();
    }

    const sendAJAXRequest = (requestData, notificationText) => {
        try {
            requestData.success = result => {
                console.info(`Succesfully sent ${requestData.type} request to ${requestData.url}, Response: ${JSON.stringify(result)}`);

                notify(notificationText);
            };

            requestData.error = result => {
                console.error(`Failed to ${requestData.type} request to ${requestData.url}, Response: ${JSON.stringify(result)}`);

                notify(notificationText, true);
            };

            $.ajax(requestData);
        } catch (error) {
            console.error(`Failed to ${requestData.type} request to ${requestData.url}, Error: ${error}`);
        }  
    };

    const httpGetFaceImages = () => {
        const url = getUrl("s");
        
        $.get(url, response => {
            if(response.ok) {
                moduleData.faces = response.faces || {};
                
                onFaceImagesReterived();
            } else {
                console.error(`Unable to reterive faces for Face Manager (${url}), Error: ${response.msg}`);
            }
        });
    };

    const deleteFaceImage = (name, image) => {
        try {
            const url = getUrl(`/${name}/image/${image}`);

            const requestData = {
                url: url,
                type: "DELETE"
            };

            const textReplacements = {
                "face": name,
                "image": image
            };

            const text = getFixedText(lang.notificationDeleteImage, textReplacements);

            sendAJAXRequest(requestData, text);
        } catch (error) {
            console.error(`Failed to delete image ${image} of face ${face}, Error: ${error}`);
        }  
    };

    const deleteFace = (name) => {
        try {
            const url = getUrl(`/${name}`);

            const requestData = {
                url: url,
                type: "DELETE"
            };

            const textReplacements = {
                "face": name
            };

            const text = getFixedText(lang.notificationDeleteFace, textReplacements);

            sendAJAXRequest(requestData, text);
        } catch (error) {
            console.error(`Failed to delete face ${name}, Error: ${error}`);
        }  
    };

    const moveFaceImage = (name, image, newFaceName) => {
        try {
            const url = getUrl(`/${name}/image/${image}/move/${newFaceName}`);

            const requestData = {
                url: url,
                type: "POST",
                data: new FormData($("#faceForm")[0]),
                cache: false,
                contentType: false,
                processData: false,
            };

            const textReplacements = {
                "face": name,
                "newFaceName": newFaceName,
                "image": image
            };

            const text = getFixedText(lang.notificationMoveImage, textReplacements);

            sendAJAXRequest(requestData, text);
        } catch (error) {
            console.error(`Failed to move image ${image} of face ${face} to ${newFaceName}, Error: ${error}`);
        }  
    };

    const loadNewFaceItem = () => {
        const htmlContent =    `<div class="col-md-4 card-page-selection">
                                    <div class="${definitions.Theme.isDark ? 'text-white' : 'text-dark'} p-3 mb-3 card shadow-sm btn-default" style="height: 300px;">
                                        <h5 class="mb-3 pb-3 <%- define.Theme.isDark ? 'text-white' : '' %> border-bottom-dotted border-color-green d-flex flex-row">
                                            <div style="flex:8">
                                                ${lang.addImage} (JPEG / PNG)
                                            </div>
                                        </h5>
                                        <form class="form-group-group card bg-dark red mt-1" id="faceForm">
                                            <div class="card-body">
                                                <div class="form-group">
                                                    <input placeholder="${lang.faceName}" class="form-control" name="faceName" id="fieldFaceName" style="border-radius: .3rem;" />
                                                </div>
                                                <div class="form-group">
                                                    <input type="file" id="fieldFaceImage" name="files" required multiple="multiple" accept="image/jpeg, image/png" />
                                                </div>
                                                <div>
                                                    <button type="submit" class="btn btn-round btn-primary mb-0 uploadImage" id="submitForm"><i class="fa fa-upload"></i>
                                                        ${lang.uploadImage}
                                                    </button>
                                                </div>
                                            </div>
                                        </dorm>
                                    </div>
                                <div>`;

        faceListRows.append(htmlContent);
    };

    const getFaceImageItems = (name) => {
        const images = moduleData.faces[name];
        const imageCount = images.length;
        const imageItems = [];

        if(imageCount === 0) {
            const noAvailableImages = "<div>No image is available</div>";

            imageItems.push(noAvailableImages);

        } else {
            const items = images.map(image => {

                const imageUrl = getUrl(`/${name}/image/${image}`);
                const imageItem =  `
                                    <div class="col-md-3 col-sm-4 m-1">
                                        <div class="col-md-1 face-image" style="background-image:url('${imageUrl}'); background-size: contain; background-repeat: no-repeat; padding: 2px; width: 100px; height: 100px; border-radius: 3px;" face="${name}" image="${image}">
                                            <a class="btn btn-sm btn-danger m-0 deleteImage" face="${name}" image="${image}"><i class="fa fa-trash"></i></a>
                                        </div>                                        
                                    </div>`;

                return imageItem;
            });

            imageItems.push(...items);
        }

        const result = imageItems.join("");

        return result;
    }

    const loadFaceItem = (name) => {
        const imageItemsDivs = getFaceImageItems(name);

        const htmlContent =    `<div data-mid="${name}" class="col-md-4 card-page-selection">
                                    <div class="${definitions.Theme.isDark ? 'text-white' : 'text-dark'} p-3 mb-3 card shadow-sm btn-default" style="height: 300px;">
                                        <h5 class="container mb-3 pb-3 <%- define.Theme.isDark ? 'text-white' : '' %> border-bottom-dotted border-color-orange d-flex flex-row">
                                            <div style="flex:8" class="faceName" face="${name}">
                                                ${name}
                                            </div>
                                            <div class="text-right">
                                                <a class="btn btn-sm btn-danger m-0 deleteFace" face="${name}"><i class="fa fa-trash"></i></a>
                                                <a class="btn btn-sm btn-primary m-0 addImage" face="${name}"><i class="fa fa-plus-square"></i></a>
                                            </div>
                                        </h5>
                                        <div class="row">
                                            ${imageItemsDivs}
                                        </div>
                                    </div>
                                <div>`;
                                
        faceListRows.append(htmlContent);

        activateDroppableContainer(name);
        activateDraggableImages(name);
    };

    const onFaceImagesReterived = () => {
        try {
            faceListRows.empty();
            
            const faceKeys = Object.keys(moduleData.faces);

            if(faceKeys.length > 0) {
                loadNewFaceItem();
                
                faceKeys.forEach(name => loadFaceItem(name));
            }

            onFormDataChanged();
            
        } catch (error) {
            console.error(`Failed to handle images reterived event, Error: ${error}`);
        }
    };
  
    const prettySizeFaceImages = () => {
        try {
            const faceImagesRendered = faceListRows.find(".face-image");
            const faceHeight = faceImagesRendered.first().width();
            faceImagesRendered.css("height", faceHeight);
        } catch (error) {
            console.error(`Failed to resize images, Error: ${error}`);
        }
    };

    const activateDroppableContainer = (name) => {
        const navigationItem = faceListRows.find(`.faceName[face="${name}"]`);

        try {
            navigationItem.droppable("destroy");
        } catch (err) {}

        try {
            navigationItem.droppable({
                tolerance: "intersect",
                accept: ".face-image",
                activeClass: "ui-state-default",
                hoverClass: "ui-state-hover",
                drop: (eventData, ui) => {
                    const newFace = getEventItemAttribute(eventData, "face", "target");
                    const oldFace = getEventItemAttribute(eventData.originalEvent, "face", "target");
                    const fileName = getEventItemAttribute(eventData.originalEvent, "image", "target");
                    const faceImageElement = $(ui.draggable);
                    
                    if (oldFace !== newFace) {
                        moveFaceImage(oldFace, fileName, newFace);
                    } else {
                        faceImageElement.css({
                            top: 0,
                            left: 0,
                        });
                    }
                },
            });
        } catch (error) {
            console.error(`Failed to activate draggable images, Face: ${name}, Error: ${error}`);
        }        
    };

    const activateDraggableImages = (name) => {
        const imageEls = faceListRows.find(`.face-image`);
        try {
            imageEls.draggable("destroy");
        } catch (err) {}

        try {
            imageEls.draggable({
                appendTo: "body",
                cursor: "move",
                revert: "invalid",
            });
        } catch (error) {
            console.error(`Failed to activate draggable images, Face: ${name}, Error: ${error}`);
        }        
    };
    
    const getEventItemAttribute = (eventData, key, targetKey = null) => {
        if(targetKey === null) {
            targetKey = "currentTarget";
        }

        window.eventItems = {
            eventData: eventData,
            targetKey: targetKey,
            key: key,
            targetElement: eventData[targetKey]
        };

        const targetElement = eventData[targetKey];
        
        const value = targetElement.attributes[key].value;

        return value;
    };

    const getFixedText = (text, replacements = {}) => {
        const replacementKeys = Object.keys(replacements);
        replacementKeys.forEach(r => {
            text = text.replace(`[${r}]`, `<b style="color: red">${replacements[r]}</b>`);
        });

        return text;
    };
    
    // Event Handlers    
    const onFormSubmitted = (e) => {
        try {
            e.preventDefault();

            const name = $("#fieldFaceName").val();
            const url = getUrl(`/${name}`);

            const requestData = {
                url: url,
                type: "POST",
                data: new FormData($("#faceForm")[0]),
                cache: false,
                contentType: false,
                processData: false
            };

            const textReplacements = {
                "face": name
            };

            const text = getFixedText(lang.notificationUploadImage, textReplacements);

            sendAJAXRequest(requestData, text);

            $("#fieldFaceName").val("");
            $("#fieldFaceImage").val("");
        } catch (error) {
            console.error(`Failed to handle form submit event, Error: ${error}`);
        } 
        
        return false;
    };

    const onAddImageRequest = (e) => {
        try {
            e.preventDefault();
            const faceName = getEventItemAttribute(e, "face");

            $("#fieldFaceName").val(faceName);
        } catch (error) {
            console.error(`Failed to handle delete image request event, Error: ${error}`);
        }  

        return false;
    };
    
    const onDeleteImageRequest = (e) => {
        try {
            e.preventDefault();
            const faceName = getEventItemAttribute(e, "face");
            const faceImage = getEventItemAttribute(e, "image");

            const imageUrl = getUrl(`/${faceName}/image/${faceImage}`);
            const textReplacements = {
                "face": faceName,
                "image": faceImage
            };

            const text = getFixedText(lang.deleteImageText, textReplacements);

            const data = {
                title: lang.deleteImage,
                body: `${text}<div class="mt-3"><img style="width:100%;border-radius:5px;" src="${imageUrl}"></div>`,
                clickOptions: {
                    class: "btn-danger",
                    title: lang.Delete,
                },
                clickCallback: () => deleteFaceImage(faceName, faceImage)
            };

            $.confirm.create(data);
        } catch (error) {
            console.error(`Failed to handle delete image request event, Error: ${error}`);
        }  

        return false;
    };

    const onDeleteFaceRequest = (e) => {
        try {
            e.preventDefault();

            const faceName = getEventItemAttribute(e, "face");

            const textReplacements = {
                "face": faceName
            };

            const text = getFixedText(lang.deleteFaceText, textReplacements);

            const data = {
                title: lang.deleteFace,
                body: text,
                clickOptions: {
                    class: "btn-danger",
                    title: lang.Delete,
                },
                clickCallback: () => deleteFace(faceName)
            };

            $.confirm.create(data);
        } catch (error) {
            console.error(`Failed to handle delete face request event, Error: ${error}`);
        }  

        return false;
    };

    const onFormDataChanged = () => {
        try {
            const name = $("#fieldFaceName").val();
            const image = $("#fieldFaceImage").val();

            const enableSubmit = name !== undefined && name !== null && name.length > 0 && image !== undefined && image !== null && image.length > 0;
            
            $("#submitForm").prop('disabled', !enableSubmit);
        } catch (error) {
            console.error(`Failed to handle image browsing, Error: ${error}`);
        }        
    };
    
    const onTabOpened = () => {
        try {
            httpGetFaceImages();
        } catch (error) {
            console.error(`Failed to handle tab opened event, Error: ${error}`);
        }          
    };
    
    const onInitSuccess = (d) => {
        try {
            moduleData.baseUrl = `${getLocation()}/${$user.auth_token}/face`;
        } catch (error) {
            console.error(`Failed to handle init success event, Error: ${error}`);
        }          
    };

    const onRecompileFaceDescriptors = (d) => {
        moduleData.faces = d.faces;

        onFaceImagesReterived();
    };

    const onFaceDataChanged = (d) => {
        httpGetFaceImages();
    };

    const onWebSocketEvent = d => {
        const handler = moduleData.eventMapper[d.f];

        if (handler !== undefined) {
            try {
                setTimeout(() => {
                    handler(d);
                }, 100);                
            } catch (error) {                
                console.error(`Failed to handle event ${d.f}, Error: ${error}`);
            } 
        }
    };

    faceListRows.on("click", ".uploadImage", e => {
        return onFormSubmitted(e); 
    });

    faceListRows.on("click", ".deleteFace", e => {
        onDeleteFaceRequest(e);
    });

    faceListRows.on("click", ".addImage", e => {
        onAddImageRequest(e);        
    });

    faceListRows.on("click", ".deleteImage", e => {
        onDeleteImageRequest(e);        
    });

    faceListRows.on("change", "#fieldFaceName", e => {
        onFormDataChanged();
    });

    faceListRows.on("change", "#fieldFaceImage", e => {
        onFormDataChanged();
    });

    $(window).resize(() => {
        try {
            prettySizeFaceImages();
        } catch (error) {
            console.error(`Failed to resize event, Error: ${error}`);
        }
        
    });

    const moduleData = {
        baseUrl: null,
        faces: {},
        eventMapper: {
            "init_success": onInitSuccess,
            "recompileFaceDescriptors": onRecompileFaceDescriptors,
            "faceFolderDeleted": onFaceDataChanged,
            "faceImageDeleted": onFaceDataChanged,
            "faceImageUploaded": onFaceDataChanged
        }
    };

    addOnTabOpen('faceManager', onTabOpened);

    onWebSocketEventFunctions.push(onWebSocketEvent);    
});
