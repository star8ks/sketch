const THREE = require('three');
const createOrbitViewer = require('three-orbit-viewer')(THREE);
const glslify = require('glslify');
const Random = require('./Random');
const Pointer = require('./Pointer');

const devEnv = true;

const blue = [new THREE.Color(0x3F87E7), new THREE.Color(0x147aff), new THREE.Color(0x1F5EBB)];
const app = createOrbitViewer({
  // clearColor: 0xa8d9ff,//0x8bb9dd,//0x52eeff,//0x355a8f
  // clearAlpha: 0.9,
  // clearColor: 0x4188E7,
  // clearAlpha: 1.0,
  clearColor: blue[0].getHex(), //0.247, 0.529, 0.905
  clearAlpha: 1.0,
  fov: 40,
  position: new THREE.Vector3(0, 0, 100)
});
console.log("app", app);
// app.controls.noZoom = true;
app.controls.noRotate = true;
app.controls.noPan = true;
// const canvas = app.renderer.domElement;

const randomSeed = new Date().getTime() % 1000000;
const random = new Random(randomSeed);

const shaderMat = new THREE.ShaderMaterial({
  vertexShader: glslify('./vert.glsl'),
  fragmentShader: glslify('./cloud.frag.glsl'),
  uniforms: {
    uResolution: new THREE.Uniform(new THREE.Vector2(app.engine.deviceWidth, app.engine.deviceHeight)),
    uTime: { type: "f", value: 0 },
    uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
    uScale: { type: "f", value: 1.0 },
    uTextureOffset: new THREE.Uniform(new THREE.Vector2(0, 0)),
    uMorphAmount: { type: "f", value: 0.0 },
    uRandomSeed: { type: "f", value: randomSeed },
    uBlue: new THREE.Uniform(new THREE.Vector3(...blue[0].toArray()))
  },
  transparent: true,
  side: THREE.DoubleSide
});

//make a box, hidden until the texture has loaded
const geo = new THREE.PlaneGeometry(100, 100);

const skyWindow = new THREE.Mesh(geo, shaderMat);
app.scene.add(skyWindow);
app.camera.lookAt(skyWindow.position);

const mouse = new Pointer(app.renderer.domElement, {
  scaleMin: 0.4,
  scaleMax: 3.0,
  pressureDuration: 1100
});

mouse.addMoveListener(e => {
  shaderMat.uniforms.uMouse = new THREE.Uniform(mouse.position);
  // console.log(shaderMat.uniforms.uMouse.value);
  // shaderMat.needsUpdate = true;
});

mouse.addDownListener(e => {
  // if play long time, unlock rotate controls
  if (morphAmount > 5) {
    app.controls.noRotate = false;
  }
});
mouse.addZoomListener(e => {
  shaderMat.uniforms.uScale.value = mouse.scale;
});

let dtSec = 0;
let lastPressingT;
mouse.addPressingListener(e => {
  lastPressingT = lastPressingT || Date.now();
  const nowInMs = Date.now();
  dtSec = (nowInMs - lastPressingT) / 1000;
  lastPressingT = nowInMs;

  textureOffset.add(mouse.position.clone().multiplyScalar(dtSec * mouse.pressure * cloudRunSpeed));
  morphAmount += dtSec * mouse.pressure;
  shaderMat.uniforms.uTextureOffset = new THREE.Uniform(textureOffset.clone());
  shaderMat.uniforms.uMorphAmount.value = morphAmount;

  // set clear blue and pass new blue
  const r = random.getBetween(morphAmount * blueVarySpeed, 0.0, 1.99);
  const baseColorIndex = Math.floor(r);
  const mixRate = r - baseColorIndex;
  const newBlue = blue[baseColorIndex].clone().lerp(blue[baseColorIndex + 1], mixRate).toArray();
  shaderMat.uniforms.uBlue = new THREE.Uniform(new THREE.Vector3(
    ...newBlue
  ));
  app.engine.context.clearColor(...newBlue, 1.0);
});
mouse.addPressingEndListener(() => {
  lastPressingT = undefined;
});

let time = 0;
let textureOffset = new THREE.Vector2(0, 0);
let morphAmount = 0;
const cloudRunSpeed = 0.01;
const blueVarySpeed = 0.1;
app.on('tick', dt => {
  let dtSec = dt / 1000;
  time += dtSec;
  shaderMat.uniforms.uTime.value = time;
});

let fovRunning = false;
let leftTopPoint = skyWindow.geometry.vertices[0];
const targetSize = 0.8;
const deltaFov = 0.4;
app.on('resize', () => {
  if(fovRunning) return;
  (function fovAnimation() {
    let leftTop = leftTopPoint.clone().applyMatrix4(skyWindow.matrixWorld).project(app.camera);
    let change = needChange(leftTop);
    if (change !== 0) {
      fovRunning = true;
      app.camera.fov += change * deltaFov;
      app.camera.updateProjectionMatrix();
      setTimeout(fovAnimation, 20);
    } else {
      fovRunning = false;
    }

    function needChange(leftTop) {
      const size = Math.max(Math.abs(leftTop.x), Math.abs(leftTop.y));
      if(size >= targetSize+0.04) {
        return 1; // too big, fov need increase
      } else if(size <= targetSize-0.04) {
        return -1; // too small, fov need decrease
      } else {
        return 0;
      }
    }
  })();
});
app.emit('resize');

console.log('The weight of clouds is the weight of the sea.');
console.log('The shape of the sea is the shape of blue.');
console.log('Don\'t know how clouds changing? Stare at them.');

if(devEnv) {
  window.t = THREE;
  window.c = app.camera;
  window.s = skyWindow;
}