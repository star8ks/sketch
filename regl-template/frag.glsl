uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;

void main() {
  vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / min(uResolution.x, uResolution.y);

  vec2 grid = vec2(20.0, 20.0);
  vec2 gridP = grid * p;
  float baseColor = 0.7;
  gl_FragColor = vec4(
    baseColor * vec3(
      sin(grid * p),
      sin(p.x + p.y + uTime)
    )
    + baseColor,
    1.0);
}