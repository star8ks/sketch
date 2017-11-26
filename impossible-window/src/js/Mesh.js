const mat4 = require('gl-mat4');

class Mesh {
  constructor(regl, { positions, cells, normals, matrix = mat4.identity([]), name = '' }, center = [0, 0, 0]) {
    this.center = center;
    this.name = name;
    this.positions = positions;
    this.elements = cells;
    this.normals = normals;
    this.matrix = matrix; // model matrix
    this.highlight = 1.0;

    let _this = this;
    this.draw = regl({

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
        model: _this.matrix,
        inverseTransposeModel: ({viewportWidth, viewportHeight}, props) => {
          return mat4.transpose([], mat4.invert(
            [], _this.matrix
          ));
        },
        uHighlight: this.highlight
      }
    });

    // function modelMatrix({viewportWidth, viewportHeight}, props) {
    //   // TODO: fit to screen shorter side
    //   const scale = props.scale;
    //   const modelMat = mat4.scale([], _this.matrix, [scale, scale, scale]);
    //   // const c = _this.center;
    //   // modelMat[12] = -c[0];
    //   // modelMat[13] = -c[1];
    //   // modelMat[14] = -c[2];
    //   return modelMat;
    // }
  }

}

export default Mesh;