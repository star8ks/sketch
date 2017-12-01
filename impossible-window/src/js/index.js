// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const mat4 = require('gl-mat4');

import { TweenMax, Linear, TimelineMax } from 'gsap';
import Pointer from './Pointer';
import Vector2 from './Vector2';
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
  console.log(cubeMesh);


  // TODO: move drag related code to UI.js->dragable(mesh)
  const rayCaster = new RayCaster(gl, scope.near, scope.far);
  let dragStartPosition;
  pointer.addDownListener((e) => {
    const invViewProjection = mat4.invert([], mat4.multiply([], scope.projectionMatrix, scope.viewMatrix));
    rayCaster.setFromOrthographicCamera(e, {
      projectionMatrix: scope.projectionMatrix,
      viewMatrix: scope.viewMatrix,
      near: scope.near,
      far: scope.far
    });

    if (rayCaster.intersectMesh(cubeMesh)) {
      dragStartPosition = pointer.position.clone();
      // TODO: highlight cubeMesh
    }
  });

  pointer.addUpListener(() => {
    dragStartPosition = undefined;
  });

  pointer.addMoveListener((e) => {
    if(!dragStartPosition) return;
    // TODO: if drag end but not success, animate to init bottomY
    // todo: caculate dx,dy with proper time interval
    const {dx, dy} = pointer;

    const needFixBottomY = cubeMesh.drag(
      new Vector2().subVectors(pointer.position, dragStartPosition),
      scope.projectionMatrix,
      scope.viewMatrix);
    if(needFixBottomY) {
      // TODO: disable highlight cubeMesh
      // animate to cubeMesh.end.bottomY
      new TimelineMax().add([
        TweenMax.to(cubeMesh, 1, { bottomY: cubeMesh.end.bottomY }),
        TweenMax.to(scope.light1Direction, 2, scope.end.light1Direction)
      ])
      .add(() => sound.yes.play(), '-=1.2')
      .add(() => timeline.success.play());
    }
  });

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
  const timeline = {
    reversePlaying: () => new TimelineMax({ paused: true })
      .add([
        TweenMax.to(status, 2, {gamePhase: 'start'}),
        TweenMax.to(cubeMesh, 1, {
          bottomY: cubeMesh.initBottomY,
          onUpdate: () => console.log(cubeMesh.bottomY)
        })
      ]),
    success: new TimelineMax({ paused: true })
      .add(() => status.gamePhase = 'success')
      .add(TweenMax.to(scope.light1Direction, 2, scope.end.light1Direction))
      // .add(() => {
      //   if(!timeline.success.reversed()) sound.yes.play();
      // }, '-=2')
      .add('scaleUp', '-=1')
      .add('showControls')
      .to(scope, 0.8, {
        viewScale: scope.end.viewScale
      }, 'scaleUp')
      .to('.author', 0.8, { display: 'block', opacity: 1 }, '-=1')
      .add(() => status.gamePhase = 'end')
      .to('#replay', 0.8, { top: '.4em' })
      .eventCallback("onReverseComplete", () => {
        status.gamePhase = 'start';
      })
  }

  const replayBtn = new ReplayBtn(document.getElementById('replay'));
  replayBtn.onClick(() => {
    timeline.success.reverse().timeScale(2.4);
    timeline.reversePlaying().play();
    sound.flashback.play();
    cubeMesh.enableDrag = true;
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

    scope.global(status, () => {
      for(let mesh of meshes) {
        scope.mesh(() => mesh.draw(scope));
      }
    });

    // if(anime.frameCount > 200) anime.pause();
  });

});

tilt3D('tilt', 30);