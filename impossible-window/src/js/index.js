// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const mat4 = require('gl-mat4');
// import TweenMax from 'gsap/TweenMax.js';
import Pointer from './Pointer';
import {bind, bindOnce} from './util';
import Mesh from './Mesh';
import ObjLoader from './ObjLoader';
import Anime from './Anime';
import tilt3D from './titl3D';
import { TweenMax, Linear, TimelineMax } from 'gsap';
// import { TweenMax, TimelineMax } from 'gsap';

const DEV = false;
const gl = regl._gl;
const canvas = regl._gl.canvas;
const pointer = new Pointer(canvas);

const sound = {
  flashback: new Audio('./sound/167683__minecast__flashback-transition.mp3'),
  yes: new Audio('./sound/245314__bwsmithatl__production-sounder-button-zipper-usage.wav')
};

fetch('oscar1.obj')
.then(response => response.text())
.then(text => {
  // const objs = text.replace(/\n+^$\n/mg, '\n') // remove empty lines
  //   .concat('\n') // add tail new line to make match below esier
  //   .match(/^o(.|\n)*?(?=(^o|\n^$))/mg);

  const infos = ObjLoader.parseObjText(text);

  let models = infos.map(info => {
    const model = {
      positions: [],
      normals: [],
      cells: [],
      matrix: mat4.identity([]),
      name: info.name
    };

    const {vert, norm, index} = info;
    for(let i=0; i<vert.length; i+=3) {
      model.positions.push([vert[i], vert[i+1], vert[i+2]]);
    }
    for(let i=0; i<norm.length; i+=3) {
      model.normals.push([norm[i], norm[i+1], norm[i+2]]);
    }
    for(let i=0; i<index.length; i+=3) {
      model.cells.push([index[i], index[i+1], index[i+2]]);
    }
    return model;
  });
  return models;
}, e => {
  alert('Model loading failed!');
  console.error(e);
})
.then(models => {
  const meshes = models.map(model => new Mesh(regl, model));
  // console.log(meshes);
  const cubeMesh = meshes[meshes.findIndex(mesh => mesh.name === 'cube')];
  console.log(cubeMesh);

  // find all vertex on cube bottom plane
  // if normal.y is -1, the vertex is on bottom face
  const bottomIndex = cubeMesh.normals
      .findIndex(normal => Math.abs(normal[1] + 1) < 0.01);
  const bottomVert = cubeMesh.positions[bottomIndex];
  const bottomVertY = bottomVert[1];
  const bottomVerts = [];
  cubeMesh.positions.forEach((position, index) => {
    if (Math.abs(position[1] - bottomVert[1]) < 0.01) {
      bottomVerts.push(position);
    }
  });

  // tween status
  TweenLite.defaultEase = Expo.easeIn;
  const magicY = -2.46;
  const status = {
    gamePhase: 'start',
    vertY: bottomVertY,
    light2: [1, -0.3, 1],
    scale: 0.8,
    highlight: 1
  };
  const end = {vertY: magicY, light2: [0, -1, 0], scale: 1};

  // console.log(TweenMax, TimelineMax)
  // cube highlight blink
  new TweenMax(status, 2, {
    highlight: 2,
    ease: Linear.easeNone,
    repeat: -1, // repeat infinately
    yoyo: true  // go back and forth (forward then backward) in every repeat
  });

  // animation after click on cube
  const timeline = new TimelineMax({ paused: true })
    .add(() => status.gamePhase = 'playing')
    .add([
      TweenMax.to(status, 2, {vertY: end.vertY}),
      TweenMax.to(status.light2, 3, end.light2)
    ])
    .add(() => {
      if(!timeline.reversed()) sound.yes.play();
    }, '-=1.04')
    .add('scaleUp', '-=1')
    .add('showControls')
    .to(status, 0.8, {scale: end.scale}, 'scaleUp')
    .to('.author', 0.8, { opacity: 1 }, '-=1')
    .add(() => status.gamePhase = 'end')
    .to('#replay', 0.8, { top: '.4em' })
    .eventCallback("onReverseComplete", enableClick);

  function enableClick() {
    // TODO: caster mouse ray to intersect with cubeMesh to trigger timeline.play
    bindOnce(canvas, 'click', () => {
      timeline.play().timeScale(10);
    }, false);
  }
  enableClick();

  bind('#replay', ['mousedown', 'mouseout', 'touchend'], function () {
    new TweenMax(this, 1, {
      textShadow: "0px 0px 0px rgba(0,0,0,0)"
    });
  });
  bind('#replay', ['mouseout', 'touchend'], function () {
    new TweenMax(this, 1, {
      opacity: 0.6
    });
  });
  bind('#replay', ['mouseover', 'touchstart'], function () {
    new TweenMax(this, .5, {
      opacity: 0.9,
      textShadow: "-1vh 1vh 1px rgba(168, 2, 40, 0.5)",
      ease: Linear.easeInOut
    });
  });

  bind('#replay', 'click', () => {
    timeline.reverse().timeScale(2.4);
    sound.flashback.play();
  }, false);


  const anime = new Anime(dt => {
    // If you are not using regl.frame() to tick your application,
    // then you should periodically call regl.poll() each frame
    // to update the timer statistics.
    regl.poll();
    regl.clear({
      depth: 1,
      color: [1, 1, 1, 0]
    });

    cubeMesh.highlight = status.gamePhase === 'start' ? status.highlight : 1.0;
    const light2 = status.light2;
    // console.log(light2);
    // console.log()

    bottomVerts.forEach(vert => {
      // const nextY = vert[1] - dt * 0.001;
      // vert[1] = nextY >= magicY ? nextY : magicY;
      vert[1] = status.vertY;
    });

    for(let mesh of meshes) {
      mesh.draw(status);
    }

    // if(anime.frameCount > 200) anime.pause();
  });

});

tilt3D('tilt', 30);