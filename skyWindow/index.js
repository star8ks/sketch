const THREE = require('three');
const createOrbitViewer = require('three-orbit-viewer')(THREE);
const glslify = require('glslify');

const Pointer = require('./Pointer');

const app = createOrbitViewer({
  clearColor: 0xa8d9ff,//0x8bb9dd,//0x52eeff,//0x355a8f
  clearAlpha: 0.9,
  fov: 70,
  position: new THREE.Vector3(0, 0, 100)
});
app.controls.noZoom = true;
app.controls.noRotate = true;

const shaderMat = new THREE.ShaderMaterial({
  vertexShader: glslify('./vert.glsl'),
  fragmentShader: glslify('./frag.glsl'),
  uniforms: {
    uTime: {type: "f", value: 0},
    uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
    uScale: {type: "f", value: 1.0},
    uTextureOffset: new THREE.Uniform(new THREE.Vector2(0, 0))
  },
  extensions: {
    // derivatives: true // don't need this now
  },
  transparent: true,
  // wireframe: true,
  // side: THREE.DoubleSide
});

//make a box, hidden until the texture has loaded
const geo = new THREE.PlaneGeometry(100, 100, 10, 10);
console.log("seg", geo.parameters.widthSegments, geo.parameters.heightSegments);

const card = new THREE.Mesh(geo, shaderMat);
app.scene.add(card);
app.camera.lookAt(card.position);

let mouse = new Pointer(app.renderer.domElement, {
  scaleMin: 0.1,
  scaleMax: 6.0,
  pressureDuration: 1100
});
mouse.addMoveListener(e => {
  shaderMat.uniforms.uMouse = new THREE.Uniform(mouse.position);
  // console.log(shaderMat.uniforms.uMouse.value);
  // shaderMat.needsUpdate = true;
});

mouse.addDownListener(e => {});
mouse.addUpListener(e => {});
mouse.addZoomListener(e => {
  shaderMat.uniforms.uScale.value = mouse.scale;
});

let time = 0;
let textureOffset = new THREE.Vector2(0, 0);
app.on("tick", dt => {
  time += dt / 1000;
  shaderMat.uniforms.uTime.value = time;
  
  textureOffset.add(mouse.position.clone().multiplyScalar(dt/1000 * mouse.pressure * mouse.scale * 0.09));
  shaderMat.uniforms.uTextureOffset = new THREE.Uniform(textureOffset.clone());
});
