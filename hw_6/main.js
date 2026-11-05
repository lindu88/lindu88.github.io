
const VERTEX_SHADER = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelView;
uniform mat4 uProjection;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
  vec4 p = uModelView * vec4(aPosition, 1.0);
  vPosition = p.xyz;
  mat3 mv = mat3(uModelView);
  vNormal = transpose(inverse(mv)) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjection * p;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uLightPos;
uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform sampler2D uBumpMap;      
uniform float uBumpStrength;

out vec4 fragColor;

void main() {
  vec4 texel = texture(uTexture, vTexCoord);
  vec3 Ka = 0.2 * texel.rgb;
  vec3 Kd = 0.8 * texel.rgb;
  vec3 Ks = vec3(0.5);
  float shininess = 32.0;

  vec3 N = normalize(vNormal);

  // Existing normal mapping
  vec3 dp1 = dFdx(vPosition);
  vec3 dp2 = dFdy(vPosition);
  vec2 duv1 = dFdx(vTexCoord);
  vec2 duv2 = dFdy(vTexCoord);
  float det = duv1.x * duv2.y - duv1.y * duv2.x;

  if (abs(det) > 0.000001) {
    vec3 T = (dp1 * duv2.y - dp2 * duv1.y) / det;
    T = normalize(T - N * dot(N, T));
    vec3 B = cross(N, T) * sign(det);
    mat3 TBN = mat3(T, B, N);

    vec3 mappedNormal = texture(uNormalMap, vTexCoord).rgb;
    mappedNormal = normalize(mappedNormal * 2.0 - 1.0);

    if (uBumpStrength > 0.0) {
      vec2 pixel = 1.0 / vec2(textureSize(uBumpMap, 0));

      float left  = texture(uBumpMap, vTexCoord - vec2(pixel.x, 0.0)).r;
      float right = texture(uBumpMap, vTexCoord + vec2(pixel.x, 0.0)).r;
      float down  = texture(uBumpMap, vTexCoord - vec2(0.0, pixel.y)).r;
      float up    = texture(uBumpMap, vTexCoord + vec2(0.0, pixel.y)).r;

      mappedNormal.xy -= uBumpStrength * vec2(right - left, up - down);
      mappedNormal = normalize(mappedNormal);
    }

    N = normalize(TBN * mappedNormal);
  }

  vec3 L = normalize(uLightPos - vPosition);
  vec3 V = normalize(-vPosition);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(V, R), 0.0), shininess);
  fragColor = vec4(Ka + Kd * diff + Ks * spec, 1.0);
}
`;

// WebGL setup
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

const ATTRIBUTES = { aPosition: 0, aNormal: 1, aTexCoord: 2 };

function createProgram(vsSource, fsSource) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
  for (const name in ATTRIBUTES) gl.bindAttribLocation(prog, ATTRIBUTES[name], name);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}

// Shader editors
const vertEditor = document.getElementById("vertEditor");
const fragEditor = document.getElementById("fragEditor");
const shaderError = document.getElementById("shaderError");
vertEditor.value = VERTEX_SHADER;
fragEditor.value = FRAGMENT_SHADER;

let program, uModelView, uProjection, uLightPos, uBumpStrength;

function updateProgram() {
  try {
    const prog = createProgram(vertEditor.value, fragEditor.value);
    if (program) gl.deleteProgram(program);
    program = prog;
    gl.useProgram(program);
    uModelView = gl.getUniformLocation(program, "uModelView");
    uProjection = gl.getUniformLocation(program, "uProjection");
    uLightPos = gl.getUniformLocation(program, "uLightPos");
    uBumpStrength = gl.getUniformLocation(program, "uBumpStrength");

    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "uNormalMap"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "uBumpMap"), 2); // NEW

    shaderError.textContent = "";
  } catch (e) {
    shaderError.textContent = e.message.replace(/\0/g, "");
  }
}
updateProgram();
vertEditor.addEventListener("input", updateProgram);
fragEditor.addEventListener("input", updateProgram);

function bindAttribute(name, data, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(ATTRIBUTES[name], size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(ATTRIBUTES[name]);
}

function createMesh({ positions, normals, texCoords, indices }) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  bindAttribute("aPosition", positions, 3);
  bindAttribute("aNormal", normals, 3);
  bindAttribute("aTexCoord", texCoords, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return { vao, count: indices.length };
}

const cubeMesh = createMesh(createCube());
const coneMesh = createMesh(createCone());
const cylinderMesh = createMesh(createCylinder());
const sphereMesh = createMesh(createSphere());

const videoTextures = [];

function createTexture(src, isNormalMap = false) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const fallback = isNormalMap ? [128, 128, 255, 255] : [128, 128, 128, 255];

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(fallback));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(src)) {
    const video = document.createElement("video");
    video.src = src;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(e => console.error("Video playback failed:", e));
    videoTextures.push({ texture, video });
  } else {
    const image = new Image();
    image.onload = () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    image.onerror = () => console.error("Failed to load:", src);
    image.src = src;
  }
  return texture;
}

// Creating textures
const cubeTex = createTexture("brick.png");
const coneTex = createTexture("water.webm");
const cylinderTex = createTexture("water.webm");
const sphereTex = createTexture("fire.webm");

// Normal map for cube
const cubeNormalTex = createTexture("brick_normal.png", true);

// Flat normal for other meshes
const flatNormalTex = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, flatNormalTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
  gl.RGBA, gl.UNSIGNED_BYTE,
  new Uint8Array([128, 128, 255, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

// NEW: Animated bump map for cone
const coneBumpTex = createTexture("water_bump.webm");

function bindTextures(diffuseTex, normalTex) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, diffuseTex);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, normalTex);
}

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);
const projection = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const lightWorld = [3, 4, 5];

// Interactive controls
let dragRotX = 0, dragRotY = -0.5;
let camX = 0, camY = 0, camZ = -7;
let sliderAngle = 0;
let spinning = false, spinAngle = 0;

let mouseDown = false, lastX, lastY;
canvas.addEventListener("mousedown", e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("mouseup", () => mouseDown = false);
window.addEventListener("mousemove", e => {
  if (!mouseDown) return;
  dragRotY += (e.clientX - lastX) * 0.01;
  dragRotX += (e.clientY - lastY) * 0.01;
  lastX = e.clientX; lastY = e.clientY;
});

document.addEventListener("keydown", e => {
  if (e.target === vertEditor || e.target === fragEditor) return;
  const step = 0.2;
  switch (e.key) {
    case "ArrowUp": camY -= step; break;
    case "ArrowDown": camY += step; break;
    case "ArrowLeft": camX += step; break;
    case "ArrowRight": camX -= step; break;
    case "w": camZ += step; break;
    case "s": camZ -= step; break;
    default: return;
  }
  e.preventDefault();
});

const axisSelect = document.getElementById("axisSelect");
document.getElementById("slider").addEventListener("input", e => {
  sliderAngle = Number(e.target.value);
  document.getElementById("sliderValue").textContent = sliderAngle;
});
document.getElementById("spinButton").addEventListener("click", () => spinning = !spinning);

// Render loop
let lastTime = 0;
function render(time) {
  const t = time / 1000;
  if (spinning) spinAngle += t - lastTime;
  lastTime = t;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (!program) { requestAnimationFrame(render); return; }
  gl.useProgram(program);

  const view = translate(camX, camY, camZ - 7.0);
  gl.uniformMatrix4fv(uProjection, false, projection);
  gl.uniform3fv(uLightPos, transformPoint(view, lightWorld));

  const axisRotation = ROTATE[axisSelect.value](sliderAngle * Math.PI / 180 + spinAngle);
  const rotation = multiply(multiply(rotateY(dragRotY), rotateX(dragRotX)), axisRotation);

  // Update all video textures, including the bump map
  gl.activeTexture(gl.TEXTURE0);
  for (const { texture, video } of videoTextures) {
    if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }
  }

  // NEW: Bind animated bump map to texture unit 2
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, coneBumpTex);

  // Cube
  gl.uniformMatrix4fv(uModelView, false,
    multiply(view, multiply(translate(-5, 0, 0), rotation)));
  bindTextures(cubeTex, cubeNormalTex);
  gl.uniform1f(uBumpStrength, 0.0);
  gl.bindVertexArray(cubeMesh.vao);
  gl.drawElements(gl.TRIANGLES, cubeMesh.count, gl.UNSIGNED_SHORT, 0);

  // Cone
  gl.uniformMatrix4fv(uModelView, false,
    multiply(view, multiply(translate(-2, 0, 0), rotation)));
  bindTextures(coneTex, flatNormalTex);
  gl.uniform1f(uBumpStrength, 3.0);
  gl.bindVertexArray(coneMesh.vao);
  gl.drawElements(gl.TRIANGLES, coneMesh.count, gl.UNSIGNED_SHORT, 0);

  // Cylinder
  gl.uniformMatrix4fv(uModelView, false,
    multiply(view, multiply(translate(2, 0, 0), rotation)));
  bindTextures(cylinderTex, flatNormalTex);
  gl.uniform1f(uBumpStrength, 0.0);
  gl.bindVertexArray(cylinderMesh.vao);
  gl.drawElements(gl.TRIANGLES, cylinderMesh.count, gl.UNSIGNED_SHORT, 0);

  // Sphere
  gl.uniformMatrix4fv(uModelView, false,
    multiply(view, multiply(translate(5, 0, 0), rotation)));
  bindTextures(sphereTex, flatNormalTex);
  gl.uniform1f(uBumpStrength, 0.0);
  gl.bindVertexArray(sphereMesh.vao);
  gl.drawElements(gl.TRIANGLES, sphereMesh.count, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
