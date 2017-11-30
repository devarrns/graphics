// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var doDraw = null;
var distanceOfCamera = 10;

function main() {
  var canvas = document.getElementById('webgl');
  var	w = canvas.width;
  var	h = canvas.height;

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }

  // 그리는 함수
  doDraw = function(longitude, latitude) {
    // 초기화
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 왼쪽 큐브
    var n = initCubeVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    var mvpMatrix_left = new Matrix4();
    mvpMatrix_left.setPerspective(30, 1, 1, 100);
    mvpMatrix_left.lookAt(30, 10, 30, 0, 0, 0, 0, 1, 0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix_left.elements);

    gl.viewport(0, 0, w/2, h);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    // 왼쪽 큐브의 선들
    var m = initLeftLinesVertexBuffers(gl, longitude, latitude);
    if (m < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    gl.viewport(0, 0, w/2, h);
    gl.drawArrays(gl.LINES, 0, m);

    // 오른쪽 큐브
    var n = initCubeVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    var rightCubeMatrix = new Matrix4();
    rightCubeMatrix.setPerspective(30, 1, 1, 100);
    // 카메라 거리 10으로 설정
    rightCubeMatrix.translate(0, 0, -distanceOfCamera);
    rightCubeMatrix.rotate(latitude, 1, 0, 0);
    rightCubeMatrix.rotate(longitude, 0, -1, 0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, rightCubeMatrix.elements);

    gl.viewport(w/2, 0, w/2, h);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    // 오른쪽 큐브의 선들
    var k = initRightLinesVertexBuffers(gl);
    if (k < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    gl.viewport(w/2, 0, w/2, h);
    gl.drawArrays(gl.LINES, 0, k);
  }

  // 초기값인 longitude = 30, latitude = 20으로 한번 그려줌
  doDraw(30, 20);
}

// 도 -> 라디안 변환 함수
function degreeToRadian(deg) {
  return deg * Math.PI / 180;
}

function changeLongitude(e) {
  var value = e.value;
  document.getElementById('longitude_value').innerHTML = value;
  doDraw(value,  parseInt(document.getElementById('latitude').value, 10));
}

function changeLatitude(e) {
  var value = e.value;
  document.getElementById('latitude_value').innerHTML = value;
  doDraw(parseInt(document.getElementById('longitude').value, 10), value);
}

// 큐브의 vertex buffer init (왼쪽 큐브와 오른쪽 큐브 둘다 사용)
function initCubeVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v0-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v0 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v0-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([     // Colors
    0.2, 0.2, 0.7,  0.2, 0.2, 0.7,  0.2, 0.2, 0.7,  0.2, 0.2, 0.7,  // v0-v1-v2-v3 front(blue)
    0.7, 0.2, 0.2,  0.7, 0.2, 0.2,  0.7, 0.2, 0.2,  0.7, 0.2, 0.2,  // v0-v3-v4-v5 right(red)
    0.2, 0.7, 0.2,  0.2, 0.7, 0.2,  0.2, 0.7, 0.2,  0.2, 0.7, 0.2,  // v0-v5-v6-v1 up(green)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  // v7-v4-v3-v2 down
    0.8, 0.1, 0.8,  0.8, 0.1, 0.8,  0.8, 0.1, 0.8,  0.8, 0.1, 0.8   // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// 왼쪽 큐브의 선들 vertex buffer init
function initLeftLinesVertexBuffers(gl, longitude, latitude) {
  // x축, y축, z축
  var vertices_arr = [
    0, 0, 0,   distanceOfCamera, 0, 0,
    0, 0, 0,   0, distanceOfCamera, 0,
    0, 0, 0,   0, 0, distanceOfCamera
  ];
  var colors_arr = [
    1, 0, 0,   1, 0, 0,
    0, 1, 0,   0, 1, 0,
    0, 0, 1,   0, 0, 1
  ];

  // 흰색 원
  for (var i = 0; i <= 360; i++) {
    vertices_arr.push(Math.cos(degreeToRadian(i)) * distanceOfCamera, 0, Math.sin(degreeToRadian(i)) * distanceOfCamera);
    colors_arr.push(1, 1, 1);
    vertices_arr.push(Math.cos(degreeToRadian(i + 1)) * distanceOfCamera, 0, Math.sin(degreeToRadian(i + 1)) * distanceOfCamera);
    colors_arr.push(1, 1, 1);
  }

  // 노란색 원
  for (var i = 0; i <= 360; i++) {
    vertices_arr.push(Math.sin(degreeToRadian(longitude)) * Math.cos(degreeToRadian(i)) * distanceOfCamera, Math.sin(degreeToRadian(i)) * distanceOfCamera, Math.cos(degreeToRadian(longitude)) * Math.cos(degreeToRadian(i)) * distanceOfCamera);
    colors_arr.push(1, 1, 0);
    vertices_arr.push(Math.sin(degreeToRadian(longitude)) * Math.cos(degreeToRadian(i + 1)) * distanceOfCamera, Math.sin(degreeToRadian(i + 1)) * distanceOfCamera, Math.cos(degreeToRadian(longitude)) * Math.cos(degreeToRadian(i + 1)) * distanceOfCamera);
    colors_arr.push(1, 1, 0);
  }

  // 핑크색 선 (카메라 시선)
  vertices_arr.push(0, 0, 0);
  colors_arr.push(1, 0.4, 0.6);
  vertices_arr.push(Math.sin(degreeToRadian(longitude)) * Math.cos(degreeToRadian(latitude)) * distanceOfCamera, Math.sin(degreeToRadian(latitude)) * distanceOfCamera, Math.cos(degreeToRadian(longitude)) * Math.cos(degreeToRadian(latitude)) * distanceOfCamera);
  colors_arr.push(1, 0.4, 0.6);

  var vertices = new Float32Array(vertices_arr);
  var colors = new Float32Array(colors_arr);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return vertices_arr.length / 3;
}

// 오른쪽 큐브의 선들 vertex buffer init
function initRightLinesVertexBuffers(gl) {
  // x축, y축, z축
  var vertices = new Float32Array([   // Vertex coordinates
    0, 0, 0,   distanceOfCamera, 0, 0,
    0, 0, 0,   0, distanceOfCamera, 0,
    0, 0, 0,   0, 0, distanceOfCamera
  ]);

  var colors = new Float32Array([
    1, 0, 0,   1, 0, 0,
    0, 1, 0,   0, 1, 0,
    0, 0, 1,   0, 0, 1
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return vertices.length / 3;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
