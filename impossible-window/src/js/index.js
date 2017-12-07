// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
import initREGL from 'regl';
import { TweenMax, Linear, TimelineMax } from 'gsap';
import Pointer from './Pointer';
import Vector2 from './Vector2';
import UI from './UI';
import { bindOnce, onceLoaded } from './util';
import PlaneBufferGeometry from './PlaneBufferGeometry';
import Mesh from './Mesh';
import DraggableMesh from './DraggableMesh';
import ModelLoader from './ModelLoader';
import AnimeLoop from './AnimeLoop';
import tilt3D from './titl3D';
import RayCaster from './RayCaster';
import drawScope from './drawScope';

const regl = initREGL();
const DEV = false;
const gl = regl._gl;
const canvas = regl._gl.canvas;
const scope = drawScope(regl);
const pointer = new Pointer(canvas);

const sound = {
  flashback: new Audio('./sound/167683__minecast__flashback-transition.mp3'),
  yes: new Audio('./sound/245314__bwsmithatl__production-sounder-button-zipper-usage.wav'),
  no: new Audio('./sound/400372__psykoosiossi__fastwhoosh.wav')
};


Promise.all([
  ModelLoader.loadObj('oscar1.obj'),
  onceLoaded()
])
.then(data => {
  const models = data[0];
  const magicY = -2.46;

  let cubeMesh;
  const meshes = models.map(model => {
    if (model.name === 'cube') {
      console.log(model);
      cubeMesh = new DraggableMesh({
        pointer: pointer,
        globalScope: scope,
        rayCaster: new RayCaster(gl, scope.near, scope.far),
        endProperty: 'bottomY',
        endValue: magicY,
        error: 0.5,
        onDragReach: () => {
          sound.yes.play();
          UI.timeline.success.play();
        },
        onDragFail: () => sound.no.play(),
      }, regl, model);
      cubeMesh.enableHighlight = true;
      return cubeMesh;
    } else {
      return new Mesh(regl, model);
    }
  });
  console.log(cubeMesh);

  UI.init({
    cubeMesh: cubeMesh,
    drawScope: scope,
    onReversePlaying() {
      cubeMesh.enableDrag = true;
      cubeMesh.startHighlight();
    }
  });
  UI.replayBtn.onClick(() => {
    UI.timeline.success.reverse().timeScale(2.4);
    UI.timeline.reversePlaying().play();
    sound.flashback.play();
  });


  const anime = new AnimeLoop(dt => {
    // If you are not using regl.frame() to tick your application,
    // then you should periodically call regl.poll() each frame
    // to update the timer statistics.
    regl.poll();
    regl.clear({
      depth: 1,
      color: [1, 1, 1, 0]
    });

    scope.global(() => {
      for(let mesh of meshes) {
        scope.mesh(() => {
          if(mesh.visible) mesh.draw(scope);
          mesh.children.forEach(childMesh => childMesh.visible && childMesh.draw());
        });
      }
    });

    // if(anime.frameCount > 200) anime.pause();
  });

});

tilt3D('tilt', 30);


