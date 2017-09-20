const THREE = require('three');
const createOrbitViewer = require('three-orbit-viewer')(THREE);
const glslify = require('glslify');

const Pointer = require('./Pointer');

const app = createOrbitViewer({
  // clearColor: 0xa8d9ff,//0x8bb9dd,//0x52eeff,//0x355a8f
  // clearAlpha: 0.9,
  // clearColor: 0x4188E7,
  // clearAlpha: 1.0,
  clearColor: 0xffffff,
  clearAlpha: 0.0,
  fov: 40,
  position: new THREE.Vector3(0, 0, 100)
});
console.log("app", app);
// app.controls.noZoom = true;
app.controls.noRotate = true;
app.controls.noPan = true;
// const canvas = app.renderer.domElement;

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
    uRandomSeed: { type: "f", value: new Date().getTime() % 1000000 }
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
  if(morphAmount > 5) {
    app.controls.noRotate = false;
  }
});
mouse.addUpListener(e => { });
mouse.addZoomListener(e => {
  shaderMat.uniforms.uScale.value = mouse.scale;
});

let time = 0;
let textureOffset = new THREE.Vector2(0, 0);
let morphAmount = 0;
const cloudRunSpeed = 0.01;
app.on("tick", dt => {
  let dtSec = dt / 1000;
  time += dtSec;
  shaderMat.uniforms.uTime.value = time;

  textureOffset.add(mouse.position.clone().multiplyScalar(dtSec * mouse.pressure * cloudRunSpeed));
  morphAmount += dtSec * mouse.pressure;
  shaderMat.uniforms.uTextureOffset = new THREE.Uniform(textureOffset.clone());
  shaderMat.uniforms.uMorphAmount.value = morphAmount;
});

// animation at start
(function fovAnimation() {
  app.camera.fov += 0.6;
  app.camera.updateProjectionMatrix();
  if(app.camera.fov <= 90) {
    setTimeout(fovAnimation, 20);
  }
})();

console.log('The weight of clouds is the weight of the sea.');
console.log('The shape of the sea is the shape of blue.');
console.log('Don\'t know how clouds changing? Stare at them.');