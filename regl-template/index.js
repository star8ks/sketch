// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const glslify = require('glslify');
import Pointer from './Pointer';

const DEV = false;
const pointer = new Pointer(regl._gl.canvas);

// Calling regl() creates a new partially evaluated draw command
const draw = regl({

  // Shaders in regl are just strings.  You can use glslify or whatever you want
  // to define them.  No need to manually create shader objects.
  frag: `
    precision mediump float;
    ` + glslify('./frag.glsl'),

  vert: glslify('./vert.glsl'),

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

// regl.frame() wraps requestAnimationFrame and also handles viewport changes
regl.frame(({time}) => {
  draw();
})