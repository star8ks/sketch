precision mediump float;
attribute vec3 position, normal;
uniform mat4 projection, view, model;
// varying vec4 vColor;
varying vec3 vNormal, vPosition;
void main() {
  vNormal = normal;
  vPosition = (model * vec4(position, 1)).xyz;
  // vColor = vec4(position, 1.0);
  gl_Position = projection * view * vec4(vPosition, 1);
}