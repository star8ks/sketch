// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
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
// Calling regl() creates a new partially evaluated draw command
const draw = regl({

  // Shaders in regl are just strings.  You can use glslify or whatever you want
  // to define them.  No need to manually create shader objects.
  frag: `
    precision mediump float;
    #define SEED ${seed}
    ` + glslify('../glsl/origin.glsl'),

  vert: glslify('../glsl/vert.glsl'),

  // Here we define the vertex attributes for the above shader
  attributes: {
    // regl.buffer creates a new array buffer object
    position: regl.buffer([
      [-1,-1],[1,-1],[-1,1],  // no need to flatten nested arrays, regl automatically
      [-1,1],[1,1],[1,-1]     // unrolls them into a typedarray (default Float32)
    ])

    // regl automatically infers sane defaults for the vertex attribute pointers
  },

  uniforms: {
    uResolution: ({viewportWidth, viewportHeight}) => [
      viewportWidth, viewportHeight
    ],
    uTime: ({tick}) => 0.01 * tick,
    uMouse: () => [pointer.position.x, pointer.position.y],
    uMorph: () => morphAmount,
    uRandomSeed: DEV ? 138975.579831 : new Date().getTime() % 1000000, //
    uGrid: ({viewportWidth, viewportHeight}) => {
      const ratio = 0.32;
      return viewportHeight >= viewportWidth ? [1, viewportHeight / viewportWidth * ratio]
        : [viewportWidth / viewportHeight * ratio, 1]
    }
  },

  // This tells regl the number of vertices to draw in this command
  count: 6
});

let anime = new AnimeLoop(() => {
  regl.poll();
  regl.clear({
    depth: 1,
    color: [0, 0, 0, 0]
  });
  draw();
});