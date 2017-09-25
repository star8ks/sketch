// adapted from http://glslsandbox.com/e#41764 by afl_ext
// #pragma glslify: snoise3 = require(glsl-noise/simplex/3d) // too slow
//precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScale;
uniform vec2 uTextureOffset;
uniform float uMorphAmount;
uniform float uRandomSeed;
uniform vec3 uBlue;


#define PI 3.14
#define ANGLE PI/5.0
// apply a rotate matrix so that clouds not seem to be arraged to grids
#define ROTATE mat2(cos(ANGLE), -sin(ANGLE), sin(ANGLE), cos(ANGLE))

float hash(float n) {
  return fract(sin(n) * uRandomSeed);
}

// return a smooth random between min and max
float randomBetween(float x, float min, float max) {
  float i = floor(x);
  float f = fract(x);
  return mix(
    hash(i), hash(i + 1.0), smoothstep(0., 1., f)
  ) * (max - min) + min;
}

// learn more about noise https://thebookofshaders.com/11/
// 3D value noise based by Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(vec3 x) {
  const vec3 step = vec3(1.0, 80.0, 800.0);
  vec3 i = floor(x);
  vec3 f = fract(x);
  // For performance, compute the base input to a 1D hash from the integer part of the argument and the 
  // incremental change to the 1D based on the 3D -> 1D wrapping
  float n = dot(i, step);

  vec3 u = f;//f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix( hash(n + dot(step, vec3(0.0, 0.0, 0.0))), hash(n + dot(step, vec3(1.0, 0.0, 0.0))), u.x),
      mix( hash(n + dot(step, vec3(0.0, 1.0, 0.0))), hash(n + dot(step, vec3(1.0, 1.0, 0.0))), u.x),
      u.y),
    mix(
      mix( hash(n + dot(step, vec3(0.0, 0.0, 1.0))), hash(n + dot(step, vec3(1.0, 0.0, 1.0))), u.x),
      mix( hash(n + dot(step, vec3(0.0, 1.0, 1.0))), hash(n + dot(step, vec3(1.0, 1.0, 1.0))), u.x),
      u.y),
    u.z
  );
}

// learn more about fbm https://thebookofshaders.com/13/
float fbm(vec3 p) {
  float f = 0.0;
  f += 0.50000 * noise(p);
  p *= 2.0; f -= 0.25000 * noise(p);
  p *= 2.0; f += 0.12500 * noise(p);
  p *= 2.0; f += 0.06250 * noise(p);
  p *= 2.0; f += 0.03125 * noise(p);
  p *= 5.01; f += 0.01250 * noise(p);
  // p *= 4.04; f -= 0.00125 * noise(p);
  return f;
}

#define CLOUD_COMPLEX 3.0
#define CLOUDY 0.8
#define MORPH_SPEED 0.004
float cloud(vec3 p) {
  p -= fbm(vec3(p.x, p.y, 0.0) * 0.5);
  float a = min((fbm(p * CLOUD_COMPLEX) * 2.0 - 1.0), 0.0);
  return a * a / (randomBetween(uMorphAmount * MORPH_SPEED, 0.3, 1.0) * CLOUDY);
}


// #define SHADOW_THRESHOLD 0.5
// #define SHADOW 0.24
#define SHADOW_THRESHOLD 0.4
#define SHADOW_GRAY 0.15
vec3 skyWindow(vec3 position) {
  float initCloud = cloud(position);
  float cloud = min(1.0, initCloud * initCloud);
  float shadow = smoothstep(0.0, SHADOW_THRESHOLD - uBlue.b*0.3, initCloud) * SHADOW_GRAY + (1.0 - SHADOW_GRAY);
  shadow = min(1.0, shadow);

  vec3 color = mix(
    vec3(shadow),
    uBlue,//vec3(0.237,0.380,0.830),//vec3(0.23, 0.33, 0.48),
    cloud
  );
  // color = 1.0 - vec3(cloud);// + vec3(shadow);
  return color;//vec3(cloud);//vec3(ic);//vec3(shadow);//
}

#define INIT_SCALE 1.0
#define initMoveSpeed 0.25
void main(void ) {
  vec2 position = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  // offset varys when mouse moving or pressing
  position += uMouse * initMoveSpeed;

  float textureScale = uScale * INIT_SCALE + randomBetween(uTime, 0.0, 0.007*INIT_SCALE);
  // todo: caclulate matrix in js, zoom in mouse position
  position *= textureScale; // zoom in center point
  position += uTextureOffset;
  gl_FragColor = skyWindow(vec3(position * ROTATE, uMorphAmount * MORPH_SPEED)).xyzz;
}