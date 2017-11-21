
const mat4 = require('gl-mat4');
const glslify = require('glslify');

class Mesh {
  constructor(regl, { positions, cells, normals, matrix, name = '' }, center = [0, 0, 0]) {
    this.center = center;
    this.name = name;
    this.positions = positions;
    this.elements = cells;
    this.normals = normals;
    this.matrix = matrix;

    let _this = this;
    this.draw = regl({

      // Shaders in regl are just strings.  You can use glslify or whatever you want
      // to define them.  No need to manually create shader objects.
      frag: `precision mediump float;
      ` + glslify('./frag.glsl'),

      vert: glslify('./vert.glsl'),

      // Here we define the vertex attributes for the above shader
      attributes: {
        // regl.buffer creates a new array buffer object
        position: () => _this.positions,
        normal: _this.normals
      },

      elements: () => {
        return _this.elements;
      },

      // This tells regl the number of vertices to draw in this command
      // count: 36,

      uniforms: {
        model: _this.modelMatrix,
        inverseTransposeModel: ({viewportWidth, viewportHeight}) => {
          return mat4.transpose([], mat4.invert(
            [], _this.modelMatrix({viewportWidth, viewportHeight})
          ));
        },
        view: ({tick}) => {
          const t = 0;//Math.PI/2;//0.01 * tick;
          return mat4.lookAt([],
            // [1, 1+Math.sin(tick*0.04), 1],
            // why 1.41 is the magic number? square root of 2?
            // it seems blender's ortho camera's default value
            [1, 1.41, 1],
            [0, 0.0, 0],
            [0, 1, 0]
          );
        },
        projection: ({viewportWidth, viewportHeight}) => {
          const scale = 0.5; // 0.5 => 0.4
          const adjustAspect = 1.3;
          const aspectRatio = viewportWidth / viewportHeight * adjustAspect / scale;
          // return mat4.perspective([], 30, aspectRatio, 0.1, 100);

          // aspectRatio make resizing not change realtive size of rendered picture
          // and horizontal resizing not change the rendered size
          return mat4.multiply(
            [],
            mat4.scale([], mat4.identity([]), [scale, scale, scale]),
            mat4.ortho([],
              -aspectRatio, aspectRatio, -1 / scale, 1 / scale,
              0.01,
              1000
            )
          );
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
        'lights[1].direction': ({ tick }, props) => {
          if (props.gameEnd) {
            // todo: move to animation
            return [0, -1, 0];
          } else {
            return [-10 * Math.sin(tick * 0.02), 10, 0];
          }
        },
        'lights[2].direction': ({ tick }, props) => {
          if (props.gameEnd) {
            // todo: move to animation
            return [0, 0, -1];//[0, 0, 10];
          } else {
            return [0, 0, -1];
          }
        },
      }
    });
  }

  modelMatrix({ viewportWidth, viewportHeight }) {
    // fit to screen size
    // const modelSize = 1200;
    // const scale = 0.3 * Math.min(viewportWidth, viewportHeight) / window.devicePixelRatio / modelSize;
    const scale = 1;
    const modelMat = mat4.scale([], this.matrix, [scale, scale, scale]);
    // const c = _this.center;
    // modelMat[12] = -c[0];
    // modelMat[13] = -c[1];
    // modelMat[14] = -c[2];
    return modelMat;
  }
}

function normalRGB(r, g, b) {
  return [r/255, g/255, b/255];
}

export default Mesh;