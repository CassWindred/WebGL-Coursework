// Vertex shader program
let VSHADER_SOURCE;
// Fragment shader program
let FSHADER_SOURCE;


let gl;

const baseurl = window.location.href;

let modelMatrix = new Matrix4(); // The model matrix
let viewMatrix = new Matrix4();  // The view matrix
let projMatrix = new Matrix4();  // The projection matrix
let g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

let ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
let g_xAngle = 0.0;    // The rotation x angle (degrees)
let g_yAngle = 0.0;    // The rotation y angle (degrees)
let ZOOM_STEP = 0.5;
let g_zoom = 0.0;

let objectSelect;
let Xinputslider;
let Yinputslider;
let Zinputslider;
let pointBrightnessinputslider;
let directionalBrightnessinputslider;
let selectedObject = "";
let sliderValX;
let sliderValY;
let sliderValZ;




let u_isDirectionalLighting;
let u_isPointLighting;
let u_isAmbientLighting;
let u_UseTextures;


let u_ModelMatrix;
let u_ViewMatrix;
let u_NormalMatrix;
let u_isLighting;
let u_ProjMatrix;
let u_Sampler;

let u_AmbientLightColor;

let u_DirectionalLightColor;
let u_LightDirection;
let u_DirectionalLightBrightness;

let pointLightPosition = new Vector3([0.6, 0.6, 0.6]);
let pointLightColor = new Vector3([1.0, 0.5, 0.4]);
let pointLightBrightness = 1;

let directionalLightColor = new Vector3([1.0, 0.5, 0.4]);
let directionalLightBrightness = 1;

let isPointLighting = 1;
let isDirectionalLighting = 1;
let isAmbientLighting = 0;
let isLighting = 1;
let useTextures = 1;

let lightBulbRotation = 0;
let lightBulbRotationStep = 0.02;
let fanStandStage = 0;
let fanBladesStage = 0;
let fanSpeed = 1;
let sofaPushing = false;
let sofaPushStage = 0;

function pushSofa() {
    sofaPushing = true;
}

function togglePointLighting() {
    isPointLighting = !isPointLighting;
    gl.uniform1f(u_isPointLighting, isPointLighting);

}

function toggleDirectionalLighting() {
    isDirectionalLighting = !isDirectionalLighting;
    gl.uniform1f(u_isDirectionalLighting, isDirectionalLighting);
}

function toggleTextures() {
    useTextures = !useTextures;
    gl.uniform1i(u_UseTextures, useTextures);
}

function toggleAmbientLighting() {
    isAmbientLighting = !isAmbientLighting;
    gl.uniform1i(u_isAmbientLighting, isAmbientLighting);
}

function toggleLighting() {
    isLighting = !isLighting;
    gl.uniform1i(u_isLighting, isLighting);
}

function updatePointLightPosition(newPosition) {
    pointLightPosition = newPosition;
    gl.uniform3fv(u_PointLightPosition, pointLightPosition.elements)
}

function updatePointBrightness() {
    gl.uniform1f(u_PointLightBrightness, pointLightBrightness);
}

function updateDirectionalBrightness() {
    gl.uniform1f(u_DirectionalLightBrightness, directionalLightBrightness);
}

const Camera = {
    viewMatrix: null,
    u_ViewMatrix: null,
    _position: new Vector3([0, 25, 40]),
    _lookAt: new Vector3([0, 0, 0]),
    resetViewMatrix: () => {
        let posElements = this._position.elements;
        let lookElements = this._lookAt.elements;
        u_ViewMatrix.setLookAt(posElements[0], posElements[1], posElements[2],
            lookElements[0], lookElements[1], lookElements[2], 0, 1, 0);
        gl.uniformMatrix4fv(u_ViewMatrix, false, this.viewMatrix.elements);
    },
    set position(newPosition) {
        this._position = newPosition;
        this.resetViewMatrix();
    },
    get position() {
        return this._position
    },
    move: (moveVector) => {
        vecElements = moveVector.elements;
        this.viewMatrix = viewMatrix.translate(vecElements[0], vecElements[1], vecElements[2]);
        gl.uniformMatrix4fv(u_ViewMatrix, false, this.viewMatrix.elements);

    },
    init: () => {
        this.viewMatrix = viewMatrix;
        this.u_ViewMatrix = u_ViewMatrix;
    }
};

let JSONObjects =
    {
        "sphere.json": {},
        "lightbulb.json": {},
        "cup.json": {},
        "beanbag.json": {},
        "fanblades.json": {},
        "fanbladescore.json": {},
    };

let loadedTextures = 0;
let Textures = {
    "wood.png": {},
    "carpet.png": {},
    "redplastic.png": {},
    "scratchedplastic.png": {},
    "leather.png": {},
    "checkfabric.png": {},
    "lightbulb.png": {}
};


Number.prototype.map = function (in_min, in_max, out_min, out_max) { //A function to map one range to another
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

async function main() {
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');


    objectSelect = document.getElementById("objectSelect");
    objectSelect.onchange = () => {
      selectedObject = objectSelect.value;
    };

    Xinputslider = document.getElementById("inputSliderX");
    Xinputslider.oninput = () => {
        document.getElementById("xout").innerHTML = Xinputslider.value / 10;
    };
    Yinputslider = document.getElementById("inputSliderY");
    Yinputslider.oninput = () => {
        document.getElementById("yout").innerHTML = Yinputslider.value / 10;
    };
    Zinputslider = document.getElementById("inputSliderZ");
    Zinputslider.oninput = () => {
        document.getElementById("zout").innerHTML = Zinputslider.value / 10;
    };

    pointBrightnessinputslider = document.getElementById("pointBrightSlider");
    pointBrightnessinputslider.oninput = () => {
        pointLightBrightness = pointBrightnessinputslider.value / 10;
        document.getElementById("pbout").innerHTML = pointLightBrightness;
        updatePointBrightness()
    };

    directionalBrightnessinputslider = document.getElementById("dirBrightSlider");
    directionalBrightnessinputslider.oninput = () => {
        directionalLightBrightness = directionalBrightnessinputslider.value / 10;
        document.getElementById("dbout").innerHTML = directionalLightBrightness;
        updateDirectionalBrightness()
    };

    // Get the rendering context for WebGL
    console.log(baseurl);
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    loadShaders();

    // Set clear color and enable hidden surface removal
    gl.clearColor(0.0, 0.0, 0.0, 0.5);
    gl.enable(gl.DEPTH_TEST);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    getUniformLocations();

    gl.uniform3f(u_AmbientLightColor, 1.0, 1.0, 1.0);

    // Set the light color (white)
    gl.uniform3f(u_DirectionalLightColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    let lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);


    gl.uniform3fv(u_PointLightColor, pointLightColor.elements);     //Set the point light color

    gl.uniform3fv(u_PointLightPosition, pointLightPosition.elements);     //Set the point light position
    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(0, 25, 40, 0, 0, 0, 0, 1, 0);

    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform letiable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    //Do initialisation for textures


    // Get the storage location of u_Sampler
    let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    console.log("Downloading Textures");
    await initialiseTextures(gl);
    console.log("Textures Downloaded");
    loadTexture(Textures["wood.png"], u_Sampler);
    gl.uniform1i(u_UseTextures, true);

    loadJSONObjects();

    document.onkeydown = function (ev) {
        keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };
    document.getElementById("toggleDirLight").onclick = () => {
        toggleDirectionalLighting();
    };
    document.getElementById("togglePointLight").onclick = () => {
        togglePointLighting();
    };
    let prevTime = Date.now();

    function tick() {
        let currTime = Date.now();
        let elapsed = currTime - prevTime; //Provides the time elapsed, in milliseconds
        prevTime = currTime;
        draw(gl, u_ModelMatrix, u_NormalMatrix, u_Sampler, elapsed);
        requestAnimationFrame(tick)
    }

    tick();
}

async function initialiseTextures(gl, u_Sampler) {
    return new Promise(((resolve, reject) => {
        for (let tex in Textures) {
            Textures[tex] = gl.createTexture();   // Create a texture object
            if (!Textures[tex]) {
                console.log('Failed to create the ' + tex + ' texture object');
                reject();
            }
            Textures[tex].image = new Image();  // Create the image object
            if (!Textures[tex].image) {
                console.log('Failed to create the ' + tex + ' image object');
                reject();
            }


            // Tell the browser to load an image
            // Register the event handler to be called on loading an image
            let textureUnits = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4,
                gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7];
            Textures[tex].image.onload = () => { //Resolves only when all textures are loaded
                Textures[tex].textureUnit = textureUnits.pop();
                Textures[tex].textureNum = textureUnits.length;
                initialiseTexture(Textures[tex]);
                loadedTextures++;
                if (loadedTextures >= Object.keys(Textures).length) {
                    resolve();
                }
            };
            Textures[tex].image.src = '../img/' + tex;

        }
    }))
}

function initialiseTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

    // Enable texture unit0
    gl.activeTexture(texture.textureUnit);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

function loadTexture(texture, u_Sampler) {
    gl.activeTexture(texture.textureUnit);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Assign u_Sampler to Correct texture
    gl.uniform1i(u_Sampler, texture.textureNum);
}

function getUniformLocations() {
    // Get the storage locations of uniform attributes

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    u_AmbientLightColor = gl.getUniformLocation(gl.program, 'u_AmbientLightColor');

    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_DirectionalLightColor = gl.getUniformLocation(gl.program, "u_DirectionalLightColor");
    u_DirectionalLightBrightness = gl.getUniformLocation(gl.program, "u_DirectionalLightBrightness");

    // Trigger using lighting or not
    u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');
    u_isPointLighting = gl.getUniformLocation(gl.program, "u_isPointLighting");
    u_isDirectionalLighting = gl.getUniformLocation(gl.program, "u_isDirectionalLighting");
    u_isAmbientLighting = gl.getUniformLocation(gl.program, "u_isAmbientLighting");

    u_PointLightColor = gl.getUniformLocation(gl.program, 'u_PointLightColor');
    u_PointLightPosition = gl.getUniformLocation(gl.program, 'u_PointLightPosition');
    u_PointLightBrightness = gl.getUniformLocation(gl.program, "u_PointLightBrightness");

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_DirectionalLightColor || !u_LightDirection ||
        !u_isLighting) {
        console.log('Failed to Get the storage locations of a First Stage Uniform');
        return;
    }
    gl.uniform1f(u_isDirectionalLighting, isDirectionalLighting);
    gl.uniform1f(u_isPointLighting, isPointLighting);
    gl.uniform1f(u_isAmbientLighting, isAmbientLighting);
    gl.uniform1f(u_PointLightBrightness, pointLightBrightness);
    gl.uniform1f(u_DirectionalLightBrightness, directionalLightBrightness);

    u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
    if (!u_UseTextures) {
        console.log('Failed to get the storage location for texture map enable flag');
        return;
    }
}

function loadShaders() {
    //Get fragment shader from server
    let request = new XMLHttpRequest();
    request.open("GET", baseurl + "/shaders/vertex.shader", false);
    request.send(null);
    if (request.status === 200) {

        VSHADER_SOURCE = request.responseText;
    } else {
        console.log("Failed to get vertex.shader from server")
    }
    //Get vertex shader from server
    request = new XMLHttpRequest();
    request.open("GET", baseurl + "/shaders/fragment.shader", false);
    request.send(null);
    if (request.status === 200) {
        FSHADER_SOURCE = request.responseText;
    } else {
        console.log("Failed to get fragment.shader from server")
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
}

function loadJSONObjects() {
    for (let filename in JSONObjects) {

        let fileText;
        //Get file from server
        request = new XMLHttpRequest();
        request.open("GET", baseurl + "/obj/" + filename, false);
        request.send(null);
        if (request.status === 200) {
            fileText = request.responseText;
        } else {
            console.log("Failed to get " + filename + " from server");
            return false;
        }
        JSONObjects[filename] = (JSON.parse(fileText))
    }
}

function keydown(ev, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
    switch (ev.keyCode) {
        case 87: // W key -> the positive rotation of arm1 around the y-axis
            g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
            break;
        case 83: // S key -> the negative rotation of arm1 around the y-axis
            g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
            break;
        case 68: // Right arrow key -> the positive rotation of arm1 around the y-axis
            g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
            break;
        case 65: // Left arrow key -> the negative rotation of arm1 around the y-axis
            g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
            break;
        case 16: //Shift
            g_zoom = (g_zoom + ZOOM_STEP);
            break;
        case 17: //Ctrl
            g_zoom = (g_zoom - ZOOM_STEP);
            break;
        default:
            return; // Skip drawing at no effective action
    }
}

function initMeshVertexBuffers(mesh, color = [0, 0, 1]) {
    function flatten(arr) { //Flattens arrays, used to flatten the faces array
        return arr.reduce(function (flat, toFlatten) {
            return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        }, []);
    }

    let vertices = new Float32Array(mesh.vertices);
    let normals = new Float32Array(mesh.normals);
    let texCoords = new Float32Array(mesh.texturecoords[0]);
    let indicearray = [];
    mesh.faces.forEach((face) => {
        indicearray = indicearray.concat(face)
    });
    //let indices = new Uint8Array(flatten(mesh.faces));
    let indices = new Uint8Array(indicearray);
    let colors = [];
    for (let i = 0; i < vertices.length / 3; i++) {
        colors = colors.concat(color)
    }
    colors = new Float32Array(colors);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initCubeVertexBuffers(gl, color = [1,0,0]) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    // Texture Coordinates
    var texCoords = new Float32Array([
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,  // v0-v3-v4-v5 right
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,  // v0-v5-v6-v1 up
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,  // v7-v4-v3-v2 down
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0   // v4-v7-v6-v5 back
    ]);

    let vertices = new Float32Array([   // Coordinates
        0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
        0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
        0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
        0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5  // v4-v7-v6-v5 back
    ]);
    let colorArray = [];
    for (let i = 0; i < 24; i++) {
        colorArray = colorArray.concat(color)

    }
    let colors = new Float32Array(colorArray);



    let normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);


    // Indices of the vertices
    let indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
    // Create a buffer object
    let buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute letiable
    let a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute letiable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}

function initAxesVertexBuffers(gl) {

    let verticesColors = new Float32Array([
        // Vertex coordinates and color (for axes)
        -20.0, 0.0, 0.0, 1.0, 1.0, 1.0,  // (x,y,z), (r,g,b)
        20.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 20.0, 0.0, 1.0, 1.0, 1.0,
        0.0, -20.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, -20.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 20.0, 1.0, 1.0, 1.0
    ]);
    let n = 6;

    // Create a buffer object
    let vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    let FSIZE = verticesColors.BYTES_PER_ELEMENT;
    //Get the storage location of a_Position, assign and enable buffer
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // Get the storage location of a_Position, assign buffer and enable
    let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}


function draw(gl, u_ModelMatrix, u_NormalMatrix, u_Sampler, elapsedtime) {
    sliderValX = parseInt(Xinputslider.value) / 10;
    sliderValY = parseInt(Yinputslider.value) / 10;
    sliderValZ = parseInt(Zinputslider.value) / 10;
    //let sliderVector = new Vector3([sliderX, sliderY, sliderZ]);
    //updatePointLightPosition(sliderVector);
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(u_isLighting, false); // Will not apply lighting


    // Set the vertex coordinates and color (for the x, y axes)

    let n = initAxesVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Calculate the view matrix and the projection matrix
    modelMatrix.setTranslate(0, 0, 0);  // No Translation
    // Pass the model matrix to the uniform letiable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Draw x and y axes
    gl.drawArrays(gl.LINES, 0, n);

    gl.uniform1i(u_isLighting, true); // Will apply lighting

    // Set the vertex coordinates and color (for the cube)
    n = initCubeVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Rotate, and then translate
    modelMatrix.setTranslate(0, 0, g_zoom);  // Translation (No translation is supported here)
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

    //Draw Cube Mesh Objects
    //Draw Floor
    loadTexture(Textures["carpet.png"], u_Sampler);
    let floorMat = new Matrix4(modelMatrix).translate(0, -5, 0).scale(30, 0.01, 30);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, floorMat);

    loadTexture(Textures["wood.png"], u_Sampler);
    let chair1Mat = new Matrix4(modelMatrix);
    if (selectedObject === "Chair 1") {chair1Mat.translate(sliderValX, sliderValY, sliderValZ)}
    chair1Mat.translate(-7, -2.6, -6);
    drawchair(gl, u_ModelMatrix, u_NormalMatrix, n, chair1Mat);

    let chair2Mat = new Matrix4(modelMatrix);
    if (selectedObject === "Chair 2") {chair2Mat.translate(sliderValX, sliderValY, sliderValZ)}
    chair2Mat.translate(7, -3, -3).rotate(-50, 0, 1, 0);
    drawchair(gl, u_ModelMatrix, u_NormalMatrix, n, chair2Mat);


    //Draw Coffee Table
    let coffeeTableMat = new Matrix4(modelMatrix);
    if (selectedObject === "Coffee Table") {coffeeTableMat.translate(sliderValX, sliderValY, sliderValZ)}
    coffeeTableMat.translate(0, -3.6, 0);
    let cupMat = new Matrix4(coffeeTableMat); //Prepare cupMatrix as child of table matrix
    drawcoffeetable(gl, u_ModelMatrix, u_NormalMatrix, n, coffeeTableMat);
    //Draw
    cupMat.translate(3.1, 0.4, -1.4);
    cupMat.scale(0.2, 0.2, 0.2);

    loadTexture(Textures["leather.png"], u_Sampler);
    let sofaMat = new Matrix4(modelMatrix);

        if (sofaPushStage<=100){
            sofaMat.translate(0,0,-(sofaPushStage/20));
            if (sofaPushing) {sofaPushStage += elapsedtime/10}
            if (sofaPushStage>100) {sofaPushing=false}

        }
        else if (sofaPushStage>100) {
            sofaMat.translate(0,0, -10+((sofaPushStage/20)));
            if (sofaPushing) {sofaPushStage += elapsedtime/10}
            if (sofaPushStage>200) {sofaPushStage=0;sofaPushing=false}
        }



    if (selectedObject === "Sofa") {sofaMat.translate(sliderValX, sliderValY, sliderValZ)}
    sofaMat.translate(0, -3.6, -6);
    drawSofa(gl, u_ModelMatrix, u_NormalMatrix, n, sofaMat);



    let tvMat = new Matrix4(modelMatrix);
    if (selectedObject === "TV") {tvMat.translate(sliderValX, sliderValY, sliderValZ)}
    tvMat.translate(0, -0.3, 10.7);
    let tvCupMat = new Matrix4(tvMat)
        .translate(-1.8, -1.3, -0.8)
        .rotate(180,0,1,0)
        .scale(0.2,0.2,0.2);
    drawTV(gl, u_ModelMatrix, u_NormalMatrix, n, tvMat);

    let fanMat = new Matrix4(modelMatrix);
    if (selectedObject === "Fan") {fanMat.translate(sliderValX, sliderValY, sliderValZ)}
    fanMat.translate(6.8,-4.5,8.2).rotate(210, 0,1,0);
    drawFan(gl, u_ModelMatrix,u_NormalMatrix,n ,fanMat, elapsedtime);


    // Draw JSON Mesh objects (THIS MUST BE DONE AFTER CUBE MESH DRAWING
    loadTexture(Textures["checkfabric.png"]);
    let beanbagMat = new Matrix4(modelMatrix);
    if (selectedObject === "Beanbag") {beanbagMat.translate(sliderValX, sliderValY, sliderValZ)}
    beanbagMat.translate(-8, -6.4, 2.4)
        .scale(6, 6, 6)
        .rotate(200, 0, 1, 0);

    drawJSONObject("beanbag.json", u_ModelMatrix, u_NormalMatrix, beanbagMat, [1, 1, 1]);

    loadTexture(Textures["redplastic.png"]);
    drawJSONObject("cup.json", u_ModelMatrix, u_NormalMatrix, cupMat);
    drawJSONObject("cup.json", u_ModelMatrix, u_NormalMatrix, tvCupMat);

    //Turn on ambient lighting for bulb draw (point light is in bulb which makes the bulb receive no light)
    gl.uniform1f(u_isAmbientLighting, 0.5);

    let lightbulbMat = new Matrix4(modelMatrix);
    if (selectedObject === "Swinging Light") {lightbulbMat.translate(sliderValX, sliderValY, sliderValZ)}

    lightbulbMat.scale(0.3, 0.3, 0.3);
    lightBulbRotation += lightBulbRotationStep * elapsedtime / 10;
    lightBulbRotation = lightBulbRotation % 360;
    let rotationValue = Math.sin(lightBulbRotation).map(-1, 1, -30, 30);
    lightbulbMat.translate(0, 32, 0);
    lightbulbMat.rotate(rotationValue, 1, 0, 0.5);

    lightbulbMat.translate(0, 0, 0);
    let lightPointMat = new Matrix4(lightbulbMat).translate(0, -17, 0);
    let bulbPositionVector = new Vector3([lightPointMat.elements[12], lightPointMat.elements[13], lightPointMat.elements[14]]);

    updatePointLightPosition(bulbPositionVector);
    loadTexture(Textures["lightbulb.png"]);
    drawJSONObject("lightbulb.json", u_ModelMatrix, u_NormalMatrix, lightbulbMat, [0.7, 0.6, 0.3]);
    gl.uniform1f(u_isAmbientLighting, 0); //lighting reset to current value

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix) {

    // Pass the model matrix to the uniform letiable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

}

function drawchair(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix) {
    //Draw Seat
    let seatmatrix = new Matrix4(modMatrix).scale(2.0, 0.5, 2.6);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, seatmatrix);

    //Draw Back
    let backmatrix = new Matrix4(modMatrix).translate(0, 1.25, -1.05).scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, backmatrix);

    //Draw Legs
    let legMat = new Matrix4(modMatrix).scale(0.4, 2, 0.4);

    let legAMat = new Matrix4(legMat);
    let legBMat = new Matrix4(legMat);
    let legCMat = new Matrix4(legMat);
    let legDMat = new Matrix4(legMat);

    legAMat.translate(-2, -0.5, -2.75);
    legBMat.translate(2, -0.5, -2.75);
    legCMat.translate(-2, -0.5, 2.75);
    legDMat.translate(2, -0.5, 2.75);

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legAMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legBMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legCMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legDMat);
}

function drawcoffeetable(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix) {
    modMatrix.scale(4, 0.7, 2);
    //Draw Draw table surface
    let surfacematrix = new Matrix4(modMatrix).scale(2.0, 0.5, 2.6);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, surfacematrix);


    //Draw Legs
    let legMat = new Matrix4(modMatrix).scale(0.4, 2, 0.4);

    let legAMat = new Matrix4(legMat);
    let legBMat = new Matrix4(legMat);
    let legCMat = new Matrix4(legMat);
    let legDMat = new Matrix4(legMat);

    legAMat.translate(-2, -0.5, -2.75);
    legBMat.translate(2, -0.5, -2.75);
    legCMat.translate(-2, -0.5, 2.75);
    legDMat.translate(2, -0.5, 2.75);

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legAMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legBMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legCMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legDMat);
}

function drawTV(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix) {
    //Draw Draw table surface
    loadTexture(Textures["wood.png"]);
    let boxStandMat = new Matrix4(modMatrix).translate(0,-3, 0).scale(5, 3, 3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, boxStandMat);

    gl.uniform1i(u_UseTextures, false); //Turn off Texture as TV is just black
    //Draw sphere that makes up the bottom of the tv stand
    let sphereStandMat = new Matrix4(modMatrix).translate(0, -1.6, 0);
    drawJSONObject("sphere.json", u_ModelMatrix, u_NormalMatrix, sphereStandMat, [0,0,0]);
    initCubeVertexBuffers(gl, [0,0,0]); //Cube buffers must be reloaded to replace the JSON object buffers

    let tvScreenMat = new Matrix4(modMatrix).translate(0, 1.5, 0).scale(8, 5, 0.3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, tvScreenMat);
    gl.uniform1i(u_UseTextures, useTextures); //Turn textures back to user setting
}

function drawSofa(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix) {

    //Draw Draw table surface
    let baseMatrix = new Matrix4(modMatrix).scale(10, 0.6, 4);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, baseMatrix);


    //Draw Legs
    let legMat = new Matrix4(modMatrix);
    let legAMat = new Matrix4(legMat);
    let legBMat = new Matrix4(legMat);
    let legCMat = new Matrix4(legMat);
    let legDMat = new Matrix4(legMat);

    legAMat.translate(5, -0.3, -2);
    legBMat.translate(5, -0.3, 2);
    legCMat.translate(-5, -0.3, -2);
    legDMat.translate(-5, -0.3, 2);

    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legAMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legBMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legCMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, legDMat);

    //Draw Arms
    let armMat = new Matrix4(modMatrix).scale(1, 2.5, 4);
    let armLeftMat = new Matrix4(armMat).translate(5, 0.5, 0);
    let armRightMat = new Matrix4(armMat).translate(-5, 0.5, 0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, armLeftMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, armRightMat);

    //Draw Back
    let backMat = new Matrix4(modMatrix)
        .rotate(-15, 1, 0, 0)
        .scale(10, 3, 0.6)
        .translate(0, 0.7, -2);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, backMat);

    //Draw Pillows
    let pillowMat = new Matrix4(modMatrix)
        .translate(0, 0.5, 0.1)
        .scale(4.2, 0.5, 3);
    let pillowLeftMat = new Matrix4(pillowMat).translate(-0.53, 0, 0);
    let pillowRightMat = new Matrix4(pillowMat).translate(0.53, 0, 0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, pillowLeftMat);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, pillowRightMat);


}

function drawFan(gl, u_ModelMatrix, u_NormalMatrix, n, modMatrix, elapsed) {
    initCubeVertexBuffers(gl, [0,0,0]); //Cube buffers must be reloaded to replace the JSON object buffers

    loadTexture(Textures["scratchedplastic.png"]);
    let baseMat = new Matrix4(modMatrix).scale(3.5, 1, 3.5);
    drawbox(gl, u_ModelMatrix,u_NormalMatrix,n,baseMat);

    let standMat = new Matrix4(modMatrix).translate(0,2.5,-0.5);



    if (fanStandStage < 100) {
        standMat.rotate(fanStandStage.map(0, 100,-30, 30), 0, 1, 0)
    } else if (fanStandStage < 200) {
        standMat.rotate((fanStandStage - 100).map(0, 100, 30, -30), 0, 1, 0)
    }
    let bladesMat = new Matrix4(standMat);
    standMat.scale(1,6,1);

    drawbox(gl, u_ModelMatrix,u_NormalMatrix,n,standMat);

    fanStandStage = (fanStandStage + fanSpeed * elapsed/30)%200;


    bladesMat.translate(0,2.3,1).scale(1,1,1);
    bladesMat.rotate(fanBladesStage, 0,0, 1);
    fanBladesStage = (fanBladesStage + fanSpeed * elapsed/3)%360;
    drawJSONObject("fanbladescore.json", u_ModelMatrix,u_NormalMatrix,bladesMat);
    drawJSONObject("fanblades.json", u_ModelMatrix,u_NormalMatrix,bladesMat);


}


function drawJSONObject(objectName, u_ModelMatrix, u_NormalMatrix, modMatrix, color = [0, 1, 0]) {
    JSONObjects[objectName].meshes.forEach((mesh, index) => {
        let n = initMeshVertexBuffers(mesh, color);
        // Pass the model matrix to the uniform letiable
        gl.uniformMatrix4fv(u_ModelMatrix, false, modMatrix.elements);

        // Calculate the normal transformation matrix and pass it to u_NormalMatrix
        g_normalMatrix.setInverseOf(modMatrix);
        g_normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

        // Draw the mesh
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    })
}

