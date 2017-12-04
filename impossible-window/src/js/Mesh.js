const mat4 = require('gl-mat4');

class Mesh {
  constructor(regl, { positions, cells, normals, matrix = mat4.identity([]), name = '' }, center = [0, 0, 0]) {
    this.center = center;
    this.name = name;
    this.positions = positions;
    this.elements = cells;
    this.normals = normals;
    this.matrix = mat4.clone(matrix); // model matrix
    this.highlight = 1.0;
    this.enableHighlight = false;
    this.visible = true;
    this.alpha = 1.0;

    let _this = this;
    this.draw = regl({
      blend: {
        enable: true,
        func: { src: 'src alpha', dst: 'one minus src alpha' }
      },

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
        model: () => this.matrix,
        inverseTransposeModel: ({viewportWidth, viewportHeight}) => {
          return mat4.transpose([], mat4.invert(
            [], _this.matrix
          ));
        },
        uHighlight: () => _this.enableHighlight ? _this.highlight : 1.0,
        uAlpha: () => _this.alpha
      }
    });

  }

}

export default Mesh;