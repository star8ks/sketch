//varying vec2 vUv;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScale;
uniform vec2 uTextureOffset;

float random(float x) {
  return fract(sin(x) * 132758.5453123);
}
float random(in vec2 st) {
  return fract(
    sin(dot(
      st.xy,
      vec2(12.9898,78.233)
    ))
    * 4321758.5453123);
}

// return a smooth random between min and max
// see https://thebookofshaders.com/11/
float randomBetween(float x, float min, float max) {
  float i = floor(x);
  float f = fract(x);
  return mix(
    random(i), random(i + 1.0), smoothstep(0., 1., f)
  ) * (max - min) + min;
}

float smootherstep(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}
vec2 smootherstep(float edge0, float edge1, vec2 v) {
  vec2 t = clamp((v - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  // Simple 2D lerp using smoothstep envelope between the values.
  // return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
  //			mix(c, d, smoothstep(0.0, 1.0, f.x)),
  //			smoothstep(0.0, 1.0, f.y)));

  // Same code, with the clamps in smoothstep and common subexpressions
  // optimized away.
  //vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 u = smoothstep(0.0, 1.0, f);
  //vec2 u = smootherstep(0.0, 1.0, f);
  return mix(a, b, u.x) + 
    (c - a) * u.y * (1.0 - u.x) + 
    (d - b) * u.x * u.y;
}

float noise(vec3 x) {
  const vec3 step = vec3(110, 241, 171);

  vec3 i = floor(x);
  vec3 f = fract(x);

  // For performance, compute the base input to a 1D hash from the integer part of the argument and the 
  // incremental change to the 1D based on the 3D -> 1D wrapping
  float n = dot(i, step);

  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix( random(n + dot(step, vec3(0, 0, 0))), random(n + dot(step, vec3(1, 0, 0))), u.x),
      mix( random(n + dot(step, vec3(0, 1, 0))), random(n + dot(step, vec3(1, 1, 0))), u.x),
      u.y),
    mix(
      mix( random(n + dot(step, vec3(0, 0, 1))), random(n + dot(step, vec3(1, 0, 1))), u.x),
      mix( random(n + dot(step, vec3(0, 1, 1))), random(n + dot(step, vec3(1, 1, 1))), u.x),
      u.y),
    u.z
  );
}

#define OCTAVES 5
float fbm (in vec2 st) {
  // Initial values
  float value = 0.0;
  float amplitud = .9;
  float frequency = 0.;
  // Loop of octaves
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitud * noise(vec3(st, uTime * 0.1));
    st *= 2.;
    amplitud *= .5;
  }
  return value;
}

vec2 clampLength(vec2 x, float a, float b) {
  return clamp(length(x), a, b) * sign(x);
}

#define cloudy 1.0
#define initMoveSpeed 40.25
#define initScale 0.008
void main() {
  vec2 st = gl_FragCoord.xy;

  vec3 color = vec3(0.0);
  float textureScale = uScale * initScale + randomBetween(uTime, 0.0, 0.011*initScale);
  // not a good way of define cloudy, because it makes all clouds brighter
  float cloud = fbm(
    (st + uMouse * initMoveSpeed) * textureScale
    + uTextureOffset
  );
  cloud = clamp(cloud * cloud * cloud, 0.0, 1.0);
  gl_FragColor = vec4(color + cloudy * cloud, cloud);
}