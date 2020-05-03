
// Vertex shader program
let VSHADER_SOURCE;
// Fragment shader program
let FSHADER_SOURCE;

let u_PointLightPosition;
let u_PointLightColor;
let u_isDirectionalLighting;
let u_isPointLighting;

let u_LightColor ;
let u_ModelMatrix;
let u_ViewMatrix ;
let u_NormalMatrix;
let u_isLighting;

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

let Xinputslider;
let Yinputslider;
let Zinputslider;




let pointLightPosition = new Vector3([0.6,0.6,0.6]);
let pointLightColor = new Vector3([0.5, 1.0, 0.5]);

let isPointLighting = 1;
let isDirectionalLighting = 1;
let isLighting = 1;

function togglePointLighting() {
    isPointLighting = !isPointLighting;
    gl.uniform1i(u_isPointLighting, isPointLighting);

}
function toggleDirectionalLighting() {
    isDirectionalLighting = !isDirectionalLighting;
    gl.uniform1i(u_isDirectionalLighting, isDirectionalLighting);
}

function toggleLighting() {
    isLighting = !isLighting;
    gl.uniform1i(u_isLighting, isLighting);
}

function updatePointLightPosition(newPosition) {

    pointLightPosition = newPosition;
    console.log(pointLightPosition);
    gl.uniform3fv(u_PointLightPosition, pointLightPosition.elements)
}

function main() {
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');
    Xinputslider = document.getElementById("inputSliderX");
    Xinputslider.oninput = ()=>{document.getElementById("xout").innerHTML = Xinputslider.value/10; draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting)};
    Yinputslider = document.getElementById("inputSliderY");
    Yinputslider.oninput = ()=>{document.getElementById("yout").innerHTML = Yinputslider.value/10; draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting)};
    Zinputslider = document.getElementById("inputSliderZ");
    Zinputslider.oninput = ()=>{document.getElementById("zout").innerHTML = Zinputslider.value/10; draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting)};

    // Get the rendering context for WebGL
    console.log(baseurl);
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    //Get fragment shader from server
    let request = new XMLHttpRequest();
    request.open("GET", baseurl+ "/shaders/vertex.shader", false);
    request.send(null);
    if (request.status === 200) {

        VSHADER_SOURCE = request.responseText;
    } else {
        console.log("Failed to get vertex.shader from server")
    }
    //Get vertex shader from server
    request = new XMLHttpRequest();
    request.open("GET", baseurl+"/shaders/fragment.shader", false);
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

    // Set clear color and enable hidden surface removal
    gl.clearColor(0.0, 0.0, 0.0, 0.5);
    gl.enable(gl.DEPTH_TEST);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Get the storage locations of uniform attributes
    let u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_PointLightColor = gl.getUniformLocation(gl.program, 'u_PointLightColor');
    u_PointLightPosition = gl.getUniformLocation(gl.program, 'u_PointLightPosition');

    // Trigger using lighting or not
    let u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');
    u_isPointLighting = gl.getUniformLocation(gl.program, "u_isPointLighting");
    u_isDirectionalLighting = gl.getUniformLocation(gl.program, "u_isDirectionalLighting");

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
        !u_isLighting ) {
        console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
        return;
    }
    gl.uniform1i(u_isDirectionalLighting, isDirectionalLighting);
    gl.uniform1i(u_isPointLighting, isPointLighting);


    // Set the light color (white)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    let lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    //Set the point light color
    gl.uniform3fv(u_PointLightColor, pointLightColor.elements);
    //Set the point light position
    gl.uniform3fv(u_PointLightPosition, pointLightPosition.elements);
    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(0, 25, 40, 0, 0, 0, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform letiable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


    document.onkeydown = function(ev){
        keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };
    document.getElementById("toggleDirLight").onclick = () => {
        toggleDirectionalLighting();
        draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };
    document.getElementById("togglePointLight").onclick = () => {
        togglePointLighting();
        draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };

    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
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
        default: return; // Skip drawing at no effective action
    }

    // Draw the scene
    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}


function initCubeVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    let vertices = new Float32Array([   // Coordinates
        0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
        0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
        0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
        -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
        0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
    ]);


    let colors = new Float32Array([    // Colors
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
    ]);


    let normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);


    // Indices of the vertices
    let indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

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

function initArrayBuffer (gl, attribute, data, num, type) {
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
        -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b)
        20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
        0.0,  20.0,   0.0,  1.0,  1.0,  1.0,
        0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
        0.0,   0.0, -20.0,  1.0,  1.0,  1.0,
        0.0,   0.0,  20.0,  1.0,  1.0,  1.0
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
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

let g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
    let m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
    return g_matrixStack.pop();
}



function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
    let sliderX = parseInt(Xinputslider.value)/10;
    let sliderY = parseInt(Yinputslider.value)/10;
    let sliderZ = parseInt(Zinputslider.value)/10;
    let sliderVector = new Vector3([sliderX, sliderY, sliderZ]);
    updatePointLightPosition(sliderVector);
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


    let chair1Mat = new Matrix4(modelMatrix);
    chair1Mat.translate(0,-3,3);
    drawchair(gl, u_ModelMatrix, u_NormalMatrix, n, chair1Mat);

    let chair2Mat = new Matrix4(modelMatrix);
    chair2Mat.translate(4,-3,3);
    drawchair(gl, u_ModelMatrix, u_NormalMatrix, n, chair2Mat);

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
    let legMat = new Matrix4(modMatrix).scale(0.4,2,0.4);

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