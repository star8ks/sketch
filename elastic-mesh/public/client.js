const THREE = require('three');
const createOrbitViewer = require('three-orbit-viewer')(THREE);
const Assets = require('./Assets');
const MouseManager = require('./MouseManager');

// Orbit - left mouse / touch: one finger move
// Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
// Pan - right mouse, or arrow keys / touch: three finger swipe

//our basic full-screen application and render loop
let time = 0;
const app = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 0.0,
  fov: 70,
  position: new THREE.Vector3(0, 0, 100)
});

let assets = new Assets();
assets.load([{
    key: 'audio-boing',
    url: 'https://cdn.glitch.com/a7e5950b-6ba6-4ecd-9a13-c6864732a451%2Fboing.mp3?1504947644759',
    loader: THREE.AudioLoader
  }, {
    key: 'tex-id',
    // url: './id.png',
    url: 'https://cdn.glitch.com/a7e5950b-6ba6-4ecd-9a13-c6864732a451%2Fid.png?1504946992645',
    loader: THREE.TextureLoader
  }, {
    key: 'file-vs',
    url: './vert.glsl',
    loader: THREE.FileLoader
}, {
    key: 'file-fs',
    url: './frag.glsl',
    loader: THREE.FileLoader
}]).then(ready);


function ready() {
  const tex = assets.get('tex-id');
  tex.minFilter = THREE.LinearFilter;

  const audioBuffer = assets.get('audio-boing');
  // a global audio source
  const audioListener = new THREE.AudioListener();
  // add the listener to the camera
  app.camera.add(audioListener);
  const boingSound = new THREE.Audio(audioListener);
  boingSound.setBuffer(audioBuffer);

  const shaderMat = new THREE.ShaderMaterial({
    vertexShader: assets.get('file-vs'),
    fragmentShader: assets.get('file-fs'),
    uniforms: {
      iChannel0: { type: 't', value: tex },
      uGrabCenter: new THREE.Uniform(new THREE.Vector3(0, 0, 0)),
      uTarget: new THREE.Uniform(new THREE.Vector3(0, 0, 0)),
      // uMousePosition: new THREE.Uniform(new THREE.Vector2(0, 0)),
      uTime: { type: 'f', value: 0 },
      uGrabStart: new THREE.Uniform(0.0),
      uReleaseStart: new THREE.Uniform(0.0),
      // uResolution: new THREE.Uniform(new THREE.Vector2(
      //   app.renderer.domElement.clientWidth,
      //   app.renderer.domElement.clientHeight
      // )),
    },
    transparent: true,
    extensions: {
      // derivatives: true
    },
    // wireframe: true, // open it for debug
    side: THREE.DoubleSide
  });
  // console.log(tex);

  const spacing = 20;
  const geo = new THREE.PlaneGeometry(
    tex.image.width/10, tex.image.height/10,
    Math.floor(tex.image.width / spacing), Math.floor(tex.image.height / spacing)
  );
  console.log('seg', geo.parameters.widthSegments, geo.parameters.heightSegments);

  const card = new THREE.Mesh(geo, shaderMat);
  // card.rotateY(Math.PI/8);

  app.scene.add(card);
  app.camera.lookAt(card.position);

  // create an (invisible) plane to drag the vertices on
  let dragPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshBasicMaterial({
      color: 0xFF0000, transparent: true, opacity: 0.0,
      depthWrite: false//, side:THREE.DoubleSide
    })
  );
  app.scene.add(dragPlane);

  console.log('app: ', app);
  console.log('card: ', card);

  const raycaster = new THREE.Raycaster();
  const mouse = new MouseManager(app.renderer.domElement);
  const canvas = app.renderer.domElement;
  let intersect = null; // mouse intersect with card
  let grabCenter = new THREE.Vector3(0, 0, 0);
  let isGrabbing = false;
  mouse.addMoveListener(() => {
    dragPlane.lookAt(app.camera.position);

    if(isGrabbing) {
      updateTargetPoint();
      return;
    }

    updateCardIntersect();
    if(grabCenter) {
      dragPlane.position.copy(grabCenter);
    }
  });

  // update mouse and card intersection
  function updateCardIntersect() {
    raycaster.setFromCamera(mouse.position, app.camera);
    let intersects = raycaster.intersectObject(card);

    if(intersects.length) {
      // enter card area
      if(!intersect) {
        intersect = intersects[0];
        canvas.classList.add('grabbable');
        // console.log('intersects', intersects);
        return;
      }

      // mouse moving within the card
      intersect = intersects[0];
      grabCenter = intersect.point;
      // console.log('change grabCenter', grabCenter);

    } else if (intersect) {
      // out of card
      intersect = null;
      canvas.classList.remove('grabbable');
    }
  }

  // update mouse and dragPlane intersection
  function updateTargetPoint(offset = 0) {
    raycaster.setFromCamera(mouse.position, app.camera);
    let intersects = raycaster.intersectObject(dragPlane);
    if(intersects.length) {
      let target = intersects[0].point.clone();
      let offsetV = offset
        ? app.camera.position.clone().sub(target).multiplyScalar(offset)
        : new THREE.Vector3(0, 0, 0);
      shaderMat.uniforms.uTarget = new THREE.Uniform(target.clone().add(offsetV));
      shaderMat.needsUpdate = true;
      // console.log('offset', offsetV);
      // console.log('target updated: ', shaderMat.uniforms.uTarget.value);
    }
  }

  mouse.addDownListener(() => {
    updateCardIntersect();
    if(intersect) {
      // grabbing start
      isGrabbing = true;
      app.controls.noRotate = true;
      canvas.classList.add('grabbing');

      updateCardIntersect();
      shaderMat.uniforms.uGrabCenter = new THREE.Uniform(grabCenter.clone());
      shaderMat.uniforms.uGrabStart.value = time;
      shaderMat.uniforms.uReleaseStart.value = 0.0;
      updateTargetPoint(0.5);
      // console.log('grabCenter:', shaderMat.uniforms.uGrabCenter.value);
    }
  });
  mouse.addUpListener(() => {
    if(isGrabbing) {
      // release grab
      isGrabbing = false;
      // if grab time shorter than the animation duration, clear uGrabStart
      shaderMat.uniforms.uGrabStart.value = 0.0;
      shaderMat.uniforms.uReleaseStart.value = time;
      app.controls.noRotate = false;
      
      // if the audio is playing, rewind to start point
      if(boingSound.isPlaying) boingSound.stop();
      boingSound.play();
    }
    if(intersect) {
      canvas.classList.remove('grabbing');
    }
  });
  mouse.addLeaveListener(() => {
    if(isGrabbing) {
      // isGrabbing = false;
      // app.controls.noRotate = false;
    }
  });

  
  //provide our shader with iGlobalTime for cool effects
  app.on('tick', dt => {
    // console.log(dt);
    time += dt / 1000;
    shaderMat.uniforms.uTime.value = time;
  });
}