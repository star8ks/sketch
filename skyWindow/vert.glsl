varying vec3 vNorm;
// varying vec2 vUv;

void main() {
  // vUv = (projectionMatrix * modelViewMatrix * vec4(uv, 1.0, 1.0)).xy;
  vNorm = position.xyz;
  gl_Position = projectionMatrix *
    modelViewMatrix * vec4(position, 1.0);
}