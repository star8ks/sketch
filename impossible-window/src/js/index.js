// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const mat4 = require('gl-mat4');

import { TweenMax, Linear, TimelineMax } from 'gsap';
import Pointer from './Pointer';
import Vector2 from './Vector2';
import { ReplayBtn } from './UI';
import { $, bindOnce, onceLoaded } from './util';
import Mesh from './Mesh';
import DraggableMesh from './DraggableMesh';
import ModelLoader from './ModelLoader';
import AnimeLoop from './AnimeLoop';
import tilt3D from './titl3D';
import RayCaster from './RayCaster';
import drawScope from './drawScope';

const DEV = false;
const gl = regl._gl;
const canvas = regl._gl.canvas;
const scope = drawScope(regl);
const pointer = new Pointer(canvas);

const sound = {
  flashback: new Audio('./sound/167683__minecast__flashback-transition.mp3'),
  yes: new Audio('./sound/245314__bwsmithatl__production-sounder-button-zipper-usage.wav')
};


Promise.all([
  ModelLoader.loadObj('oscar1.obj'),
  onceLoaded()
])
.then(data => {
  const models = data[0];
  const $replay = $`#replay`;
  const magicY = -2.46;

  let cubeMesh;
  const meshes = models.map(model => {
    if(model.name === 'cube') {
      cubeMesh = new DraggableMesh({
        pointer: pointer,
        globalScope: scope,
        rayCaster: new RayCaster(gl, scope.near, scope.far),
        endBottomY: magicY,
        error: 0.5,
        onDragReach: () => {
          timeline.fixBottomY().play();
        }
      }, regl, model);
      cubeMesh.enableHighlight = true;
      return cubeMesh;
    }else {
      return new Mesh(regl, model);
    }
  });
  console.log(cubeMesh);


  TweenLite.defaultEase = Expo.easeIn;

  // animation after click on cube
  const timeline = {
    fixBottomY: () => new TimelineMax({ paused: true })
      .add(TweenMax.to(cubeMesh, 4 * Math.abs(cubeMesh.bottomY - cubeMesh.end.bottomY), { bottomY: cubeMesh.end.bottomY }))
      .add(() => sound.yes.play(), '+=0.4')
      .add(() => timeline.success.play(), '-=0.4'),
    reversePlaying: () => new TimelineMax({ paused: true })
      .add([
        TweenMax.to(scope, 2, {gamePhase: 'start'}),
        TweenMax.to(cubeMesh, 1, {
          bottomY: cubeMesh.initBottomY
        })
      ])
      .add(() => {
        cubeMesh.enableDrag = true;
        cubeMesh.startHighlight();
      }),
    success: new TimelineMax({ paused: true })
      .add(() => scope.gamePhase = 'success')
      .add(TweenMax.to(scope.light1Direction, 2, scope.end.light1Direction))
      .add('scaleUp', '-=1')
      // .add('showControls')
      .to(scope, 0.8, {
        viewScale: scope.end.viewScale
      }, 'scaleUp')
      .to($replay, 0.8, { top: '.4em' }, 'scaleUp')
      .add(() => scope.gamePhase = 'end')
      .to('.author', 0.8, { display: 'block', opacity: 1 }, '-=1')
      .eventCallback("onReverseComplete", () => {
        scope.gamePhase = 'start';
      })
  }

  const replayBtn = new ReplayBtn($replay);
  replayBtn.onClick(() => {
    timeline.success.reverse().timeScale(2.4);
    timeline.reversePlaying().play();
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
        scope.mesh(() => mesh.draw(scope));
      }
    });

    // if(anime.frameCount > 200) anime.pause();
  });

});

tilt3D('tilt', 30);