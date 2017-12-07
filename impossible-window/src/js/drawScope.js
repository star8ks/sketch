const glslify = require('glslify');
import mat4 from 'gl-mat4';
import { normalRGB } from './util';

/**
 * return a draw scope
 */
const drawScope = function (regl) {
  const scope = {
    // end status of property animation
    end: {
      light1Direction: [0, -1, 0],
      viewScale: 1
    },
    gamePhase: 'start',
    initViewMatrix: mat4.lookAt([],
      // [1, 1+Math.sin(tick*0.04), 1],
      // why 1.41 is the magic number? square root of 2?
      // it seems blender's ortho camera's default value
      [1, 1.4142, 1],
      [0, 0.0, 0],
      [0, 1, 0]
    ),
    // viewMatrix: new Float32Array([1, -0, 0, 0, 0, 0.876966655254364, 0.48055124282836914, 0, -0, -0.48055124282836914, 0.876966655254364, 0, 0, 0, -11.622776985168457, 1]), // for test
    projectionMatrix: new Float32Array(16),
    near: 0.1,
    far: 100,
    viewScale: 0.8,
    light1Direction: [1, -0.3, 1],

    // keeps track of all global state.
    global: regl({
      uniforms: {
        view: () => scope.viewMatrix,
        projection: ({ viewportWidth, viewportHeight }) => {
          const scale = .52; // 0.5 => 0.4
          const adjustAspect = 1.3;//1.4142;//
          const aspect = viewportWidth / viewportHeight * adjustAspect / scale;
          // return mat4.perspective([], 30, aspect, 0.1, 100);

          // aspect make resizing not change realtive size of rendered picture
          // and horizontal resizing not change the rendered size
          scope.projectionMatrix = mat4.multiply(
            [],
            mat4.scale([], mat4.identity([]), [scale, scale, scale]),
            mat4.ortho(
              [],
              -aspect, aspect, -1 / scale, 1 / scale,
              scope.near,
              scope.far
            )
          );

          // scope.projectionMatrix = mat4.perspective([], 90, aspect, 0.01, 1000);
          // mat4.perspective(scope.projectionMatrix,
          //   Math.PI / 4,
          //   viewportWidth / viewportHeight,
          //   0.01,
          //   1000);

          return scope.projectionMatrix;
        },

        // directional lights
        'lights[0].color': normalRGB(168, 2, 40),
        'lights[1].color': normalRGB(238, 12, 84),//[0.85, 0.027, 0.26],//
        'lights[2].color': normalRGB(212, 7, 66),//[0.788, 0.011, 0.243],
        // 'lights[0].color': [1, 0, 0],
        // 'lights[1].color': [0, 1, 0],
        // 'lights[2].color': [0, 0, 1],
        'lights[0].direction': [-1, 0, 0],
        // 'lights[0].direction': ({tick}) => [10 * (1+Math.sin(tick*0.01)), 10 * Math.cos(tick*0.01), 0],
        'lights[1].direction': () => scope.light1Direction,
        'lights[2].direction': [0, 0, -1],
      }
    }),

    mesh: regl({
      frag: `precision mediump float;
      ` + glslify('../glsl/frag.glsl'),

      vert: glslify('../glsl/vert.glsl'),
    })
  };

  Object.defineProperty(scope, 'viewMatrix', {
    get: function() {
      return mat4.scale([], this.initViewMatrix, [this.viewScale, this.viewScale, this.viewScale]);
    }
  });

  return scope;
};

export default drawScope;