uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;

struct Light {
  vec3 color;
  vec3 position;
};
uniform Light lights[3];

// varying vec4 vColor;
varying vec3 vNormal, vPosition;
void main () {
  vec3 color = vec3(0, 0, 0);
  for (int i = 0; i < 3; ++i) {
    vec3 lightDir = normalize(lights[i].position - vPosition);
    float diffuse = max(0.0, dot(lightDir, normalize(vNormal)));
    color += diffuse * lights[i].color;
  }
  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = vec4(vNormal, 1.0);
  // gl_FragColor = vColor;
}

// void main() {
//   vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / min(uResolution.x, uResolution.y);

//   vec2 grid = vec2(20.0, 20.0);
//   vec2 gridP = grid * p;
//   float baseColor = 0.7;
//   gl_FragColor = vec4(
//     baseColor * vec3(
//       sin(grid * p),
//       sin(p.x + p.y + uTime)
//     )
//     + baseColor,
//     1.0);
// }