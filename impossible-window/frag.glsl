uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform mat4 model;

struct Light {
  vec3 color;
  vec3 direction;
};
uniform Light lights[3];

// https://webgl2fundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html
vec3 directionalLighting(vec3 lightDirection, vec3 lightColor, vec3 normal) {
  float diffuse = clamp(
    // reverse lightDirection to get right diffuse
    dot(normalize(-lightDirection), normal),
    0.0, 1.0
  );
  return diffuse * lightColor;
}

// varying vec4 vColor;
varying vec3 vNormal;
void main () {
  // because v_normal is a varying it's interpolated
  // so it will not be a uint vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(vNormal);

  vec3 materialDiffuseColor = vec3(1.0, 1.0, 1.0);
  vec3 color = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < 3; ++i) {
    color += materialDiffuseColor * directionalLighting(
      lights[i].direction,
      lights[i].color,
      normal
    );
  }
  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = vec4(normal, 1.0);
  // gl_FragColor = vColor;
}