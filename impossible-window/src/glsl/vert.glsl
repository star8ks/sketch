precision mediump float;
attribute vec3 position, normal;
uniform mat4 projection, view, model, inverseTransposeModel;
// varying vec4 vColor;
varying vec3 vNormal;
void main() {
  // Multiply by model matrix so that
  // normal changing with model rotation
  // See https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-3d-lighting-directional.html
  // vNormal = mat3(model) * normal;

  // Multiply by inverse transpose of model matrix(i.e. (model^-1)^T) so that
  // normal also changing with scale on model matrix
  vNormal = mat3(inverseTransposeModel) * normal;

  // vColor = vec4(position, 1.0);
  gl_Position = projection * view * vec4(mat3(model) * position, 1.0);
}