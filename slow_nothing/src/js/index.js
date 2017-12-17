const regl = require('regl')();
const glslify = require('glslify');
import Pointer from './Pointer';
import AnimeLoop from './AnimeLoop';

const DEV = false;
const seed = DEV ? 13875.579831 : new Date().getTime() % 100000 + 0.5831;

const pointer = new Pointer(regl._gl.canvas);
let morphAmount = 0;
pointer.addPressingListener(e => {
  morphAmount += pointer.pressCheckInterval / 1000 * pointer.pressure * 0.1;
});

// TODO: use a global drawScope to define attributes and uniforms, switch different shaders
// TODO: user defined fragment shader
// TODO: masking transition on switching shaders
const globalScope = regl({
  vert: glslify('../glsl/vert.glsl'),

  attributes: {
    position: regl.buffer([
      [-1,-1],[1,-1],[-1,1],  // no need to flatten nested arrays, regl automatically
      [-1,1],[1,1],[1,-1]     // unrolls them into a typedarray (default Float32)
    ])
  },

  uniforms: {
    uResolution: ({viewportWidth, viewportHeight}) => [
      viewportWidth, viewportHeight
    ],
    uTime: ({tick}) => 0.01 * tick,
    uMouse: () => [pointer.position.x, pointer.position.y],
    uMorph: () => morphAmount,
    uGrid: ({viewportWidth, viewportHeight}) => {
      const ratio = 0.32;
      return viewportHeight >= viewportWidth ? [1, viewportHeight / viewportWidth * ratio]
        : [viewportWidth / viewportHeight * ratio, 1]
    }
  },

  count: 6
});

const fragShaders = [
  glslify.file('../glsl/origin.glsl'),
  glslify.file('../glsl/slow1.glsl')
];
const modes = fragShaders.map(shader =>
  regl({
    frag: `precision mediump float;
        #define SEED ${seed}
        ` + shader,
  })
);

// TODO: if click on another mode through UI, push mode to `drawModes`
const drawModes = [modes[0]];

let anime = new AnimeLoop(() => {
  regl.poll();
  regl.clear({
    depth: 1,
    color: [0, 0, 0, 0]
  });

  globalScope(() => {
    // TODO: if modes.length > 1, try some masking transition on them,
    // and after transition done, remove all modes except the last one
    for(let draw of drawModes) {
      draw();
    }
  });
});