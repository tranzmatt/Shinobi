$(document).ready(() => {
    //const faceManagerModal = $("#faceManager");
    const faceImageList = $("#faceImageList");
    const faceNvigationPanel = $("#faceNvigationPanel");

    const faceManagerForm = $("#faceManagerUploadForm");
    const faceNameField = $("#faceNameField");
    const fileinput = $("#fileinput");
    const faceManagerUploadStatus = $("#faceManagerUploadStatus");

    const getUrl = (endpoint) => {
        const url = `${moduleData.baseUrl}${endpoint}`;

        return url;
    };

    const getFaceImages = () => {
        const url = getUrl("s");
        
        $.get(url, response => {
            moduleData.faces = response.faces || {};

            onFaceImagesReterived();
        });
    };

    const sendAJAXRequest = (requestData) => {
        try {
            requestData.success = result => {
                console.info(`Succesfully sent ${requestData.type} request to ${requestData.url}, Response: ${JSON.stringify(result)}`);
            };

            requestData.error = result => {
                console.error(`Failed to ${requestData.type} request to ${requestData.url}, Response: ${JSON.stringify(result)}`);
            };

            $.ajax(requestData);
        } catch (error) {
            console.error(`Failed to ${requestData.type} request to ${requestData.url}, Error: ${error}`);
        }  
    };

    const deleteFaceImage = (name, image) => {
        try {
            const url = getUrl(`/${name}/image/${image}`);

            const requestData = {
                url: url,
                type: "DELETE"
            };

            sendAJAXRequest(requestData);
        } catch (error) {
            console.error(`Failed to delete image ${image} of face ${face}, Error: ${error}`);
        }  
    };

    const deleteFaceFolder = (name) => {
        try {
            const url = getUrl(`/${name}`);

            const requestData = {
                url: url,
                type: "DELETE"
            };

            sendAJAXRequest(requestData);
        } catch (error) {
            console.error(`Failed to delete face ${face}, Error: ${error}`);
        }  
    };

    const moveFaceImage = (name, image, newFaceName) => {
        try {
            const url = getUrl(`/${name}/image/${image}/move/${newFaceName}`);

            const requestData = {
                url: url,
                type: "POST",
                data: new FormData(faceManagerForm[0]),
                cache: false,
                contentType: false,
                processData: false,
            };

            sendAJAXRequest(requestData);
        } catch (error) {
            console.error(`Failed to move image ${image} of face ${face} to ${newFaceName}, Error: ${error}`);
        }  
    };
    
    const onFormSubmitted = () => {
        try {
            const name = faceNameField.val();
            const url = getUrl(`/${name}`);

            const requestData = {
                url: url,
                type: "POST",
                data: new FormData(faceManagerForm[0]),
                cache: false,
                contentType: false,
                processData: false
            };

            faceManagerUploadStatus.show();

            sendAJAXRequest(requestData);

            faceNameField.val("");
            fileinput.val("");
        } catch (error) {
            console.error(`Failed to handle form submit event, Error: ${error}`);
        }  
    };

    const getFaceNavigationItem = (name) => {
        const images = moduleData.faces[name];
        const imageCount = images.length;

        const navigationItem = `<li class="nav-item" face="${name}" style="display: flex; flex-direction: row; align-items: center;">
                                    <a class="nav-link faceNavigation" data-toggle="tab" href="#" face="${name}" style="margin-left: 5px; margin-right: 5px;">${name} <span class="badge badge-dark badge-pill" style="margin-left: 5px; margin-right: 5px;">${imageCount}</span></a>                                    
                                </li>`;

        return navigationItem;
    };

    const getFaceDelete = (name) => {
        const navigationItem = `<div style="padding: 5px;">
                                    <a class="btn btn-sm btn-danger m-0 deleteFolder" style="margin-left: 5px; margin-right: 5px;" face="${name}"><i class="fa fa-trash"></i> ${lang.deleteFace}</a>
                                </div>`;

        return navigationItem;
    };

    const getImageListItem = (name, image) => {
        const imageUrl = getUrl(`/${name}/image/${image}`);
        const imageItem = `<div class="col-md-2 face-image" style="background-image:url('${imageUrl}'); background-size: contain; background-repeat: no-repeat; width: 150px; height: 150px; padding: 2px;" face="${name}" image="${image}">
                                <a class="btn btn-sm btn-danger m-0 deleteImage" face="${name}" image="${image}"><i class="fa fa-trash"></i></a>
                            </div>`;

        return imageItem;
    };

    const onSelectedFaceChanged = () => {
        try {
            $(`#faceNvigationPanel li[face="${moduleData.selectedFace}"] a`).tab('show');

            faceImageList.empty();
            const images = moduleData.faces[moduleData.selectedFace];
            const items = images.map(image => getImageListItem(moduleData.selectedFace, image));

            const deleteFace = getFaceDelete(moduleData.selectedFace);
            items.push(deleteFace);

            const html = items.join("");
            faceImageList.html(html);

            activateDraggableImages();
            prettySizeFaceImages();
        } catch (error) {
            console.error(`Failed to handle face [${moduleData.selectedFace}] selection changed event, Error: ${error}`);
        }
    };

    const onFaceImagesReterived = () => {
        try {
            faceNvigationPanel.empty();
            faceImageList.empty();
            faceManagerUploadStatus.hide();
            
            const faceKeys = Object.keys(moduleData.faces);

            if(faceKeys.length > 0) {
                if(moduleData.selectedFace === null) {
                    moduleData.selectedFace = faceKeys[0];
                }                

                const items = faceKeys.map(name => getFaceNavigationItem(name));

                const html = items.join("");

                faceNvigationPanel.html(html);

                faceKeys.forEach(name => activateDroppableContainer(name));

                onSelectedFaceChanged();
            }
            
        } catch (error) {
            console.error(`Failed to handle images reterived event, Error: ${error}`);
        }
    };
  
    const drawFaceImages = (selectedFace = null) => {
        try {
            moduleData.selectedFace = selectedFace;
            
            onFormDataChanged();

            getFaceImages();
        } catch (error) {
            console.error(`Failed to draw face images, Error: ${error}`);
        }
    };
  
    const prettySizeFaceImages = () => {
        try {
            const faceImagesRendered = faceImageList.find(".face-image");
            const faceHeight = faceImagesRendered.first().width();
            faceImagesRendered.css("height", faceHeight);
        } catch (error) {
            console.error(`Failed to resize images, Error: ${error}`);
        }
    };

    const activateDroppableContainer = (name) => {
        const navigationItem = faceNvigationPanel.find(`.nav-item[face="${name}"]`);

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
        const imageEls = faceImageList.find(`.face-image`);
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

    $(window).resize(() => {
        try {
            prettySizeFaceImages();
        } catch (error) {
            console.error(`Failed to resize event, Error: ${error}`);
        }
        
    });
    
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
            text = text.replace(`{${r}}`, `<b style="color: red">${replacements[r]}</b>`);
        });

        return text;
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
                clickCallback: () => deleteFaceFolder(faceName)
            };

            $.confirm.create(data);
        } catch (error) {
            console.error(`Failed to handle delete face request event, Error: ${error}`);
        }  

        return false;
    };

    const onFormDataChanged = () => {
        try {
            const name = faceNameField.val();
            const image = fileinput.val();

            const enableSubmit = name !== undefined && name !== null && name.length > 0 && image !== undefined && image !== null && image.length > 0;

            $("#submitUpload").prop('disabled', !enableSubmit);
        } catch (error) {
            console.error(`Failed to handle image browsing, Error: ${error}`);
        }        
    };

    const onInitSuccess = (d) => {
        try {
            moduleData.baseUrl = `${superApiPrefix}${d.superSessionKey}/face`;

            drawFaceImages();
        } catch (error) {
            console.error(`Failed to handle init success event, Error: ${error}`);
        }          
    };

    const onRecompileFaceDescriptors = (d) => {
        moduleData.faces = d.faces;

        onFaceImagesReterived();
    };

    const onFaceFolderDeleted = (d) => {
        drawFaceImages();
    };

    const onFaceImageDeleted = (d) => {
        drawFaceImages(moduleData.selectedFace);
    };

    const onFaceImageUploaded = (d) => {
        drawFaceImages(d.faceName);
    };

    const moduleData = {
        baseUrl: null,
        faces: {},
        selectedFace: null,
        eventMapper: {
            "init_success": onInitSuccess,
            "recompileFaceDescriptors": onRecompileFaceDescriptors,
            "faceFolderDeleted": onFaceFolderDeleted,
            "faceImageDeleted": onFaceImageDeleted,
            "faceImageUploaded": onFaceImageUploaded
        }
    };

    $.ccio.ws.on("f", (d) => {
        const handler = moduleData.eventMapper[d.f];

        if (handler === undefined) {
            console.info(`No handler found, Data: ${JSON.stringify(d)}`);
        } else {
            try {
                setTimeout(() => {
                    handler(d);
                }, 100);                
            } catch (error) {                
                console.error(`Failed to handle event ${d.f}, Error: ${error}`);
            } 
        }
    });    

    // Upload image 
    faceManagerForm.submit(() => {
        onFormSubmitted();

        return false;
    });

    $("div").on("click", ".deleteFolder", e => {
        onDeleteFaceRequest(e);
    });

    faceImageList.on("click", ".deleteImage", e => {
        onDeleteImageRequest(e);
    });

    faceNameField.change(() => {
        onFormDataChanged();
    });

    fileinput.change(() => {
        onFormDataChanged();
    });

    faceNvigationPanel.on('click', ".faceNavigation", e => {
        const faceName = getEventItemAttribute(e, "face");
        
        if(faceName !== moduleData.selectedFace) {
            moduleData.selectedFace = faceName;

            onSelectedFaceChanged();
        }

        
    });
});
