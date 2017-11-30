// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const mat4 = require('gl-mat4');

import { TweenMax, Linear, TimelineMax } from 'gsap';
import Pointer from './Pointer';
import { ReplayBtn } from './UI';
import { bindOnce } from './util';
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





ModelLoader.loadObj('oscar1.obj')
.then(models => {
  let cubeMesh;
  const magicY = -2.46;
  const meshes = models.map(model => {
    if(model.name === 'cube') {
      cubeMesh = new DraggableMesh({endBottomY: magicY}, regl, model);
      return cubeMesh;
    }else {
      return new Mesh(regl, model);
    }
  });
  // console.log(meshes);
  console.log(cubeMesh);

  TweenLite.defaultEase = Expo.easeIn;
  // tween status
  const status = {
    gamePhase: 'start',
    highlight: 1
  };

  // console.log(TweenMax, TimelineMax)
  // cube highlight blink
  new TweenMax(status, 2, {
    highlight: 2,
    onUpdate: () => {
      cubeMesh.highlight = status.gamePhase === 'start' ? status.highlight : 1.0;
    },
    ease: Linear.easeNone,
    repeat: -1, // repeat infinately
    yoyo: true  // go back and forth (forward then backward) in every repeat
  });

  // animation after click on cube
  const timeline = new TimelineMax({ paused: true })
    .add(() => status.gamePhase = 'playing')
    .add([
      TweenMax.to(cubeMesh, 2, {bottomY: cubeMesh.end.bottomY}),
      TweenMax.to(scope.light1Direction, 3, scope.end.light1Direction)
    ])
    .add(() => {
      if(!timeline.reversed()) sound.yes.play();
    }, '-=1.04')
    .add('scaleUp', '-=1')
    .add('showControls')
    .to(scope, 0.8, {
      viewScale: scope.end.viewScale
    }, 'scaleUp')
    .to('.author', 0.8, { display: 'block', opacity: 1 }, '-=1')
    .add(() => status.gamePhase = 'end')
    .to('#replay', 0.8, { top: '.4em' })
    .eventCallback("onReverseComplete", enableClick);

  const replayBtn = new ReplayBtn(document.getElementById('replay'));
  replayBtn.onClick(() => {
    timeline.reverse().timeScale(2.4);
    sound.flashback.play();
  });

  const rayCaster = new RayCaster(gl, scope.near, scope.far);
  function enableClick() {
    bindOnce(canvas, 'click', e => {
      const invViewProjection = mat4.invert([], mat4.multiply([], scope.projectionMatrix, scope.viewMatrix));
      rayCaster.setFromOrthographicCamera(e, {
        projectionMatrix: scope.projectionMatrix,
        viewMatrix: scope.viewMatrix,
        near: scope.near,
        far: scope.far
      });

      if(!rayCaster.intersectMesh(cubeMesh)) {
        return false; // return false so intersect test wil be triggered again
      } else {
        timeline.play().timeScale(1.5);
      }
    });
  }
  enableClick();


  const anime = new AnimeLoop(dt => {
    // If you are not using regl.frame() to tick your application,
    // then you should periodically call regl.poll() each frame
    // to update the timer statistics.
    regl.poll();
    regl.clear({
      depth: 1,
      color: [1, 1, 1, 0]
    });

    scope.global(status, () => {
      for(let mesh of meshes) {
        scope.mesh(() => mesh.draw(scope));
      }
    });

    // if(anime.frameCount > 200) anime.pause();
  });

});

tilt3D('tilt', 30);