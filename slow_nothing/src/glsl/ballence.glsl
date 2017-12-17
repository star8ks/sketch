precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;

const int   complexity  = 20;    // More points of color.
const float mouseSpeed  = 0.01; // Makes it more/less jumpy.
const float offset = 0.7;  // Drives complexity in the amount of curls/cuves.  Zero is a single whirlpool.
const float fluidSpeed  = 0.26;  // Drives speed, smaller number will make it slower.
const float baseColor   = 0.6;
const float BLUR        = 0.47;
const float gridX       = 3.0;
const float gridY       = 2.0;

#define PI 3.14159

// more about noise: 
// http://thebookofshaders.com/11/
float random(float x) {
  return fract(sin(x) * 138975.579831);
}
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(random(i), random(i + 1.0), smoothstep(0.0, 1.0, f));
}
float noiseS(float x) {
  return noise(x) * 2.0 - 1.0;
}

void main() {
  vec2 p = (2.0 * gl_FragCoord.xy - resolution) / max(resolution.x, resolution.y);
  float deltaT = time * fluidSpeed;
  float noiseTime = noise(deltaT);
  float noiseSTime = noiseS(deltaT);
  float noiseSTime1 = noiseS(deltaT + 1.0);

  float blur = (BLUR + 0.14 * noiseSTime);
  for(int i=1; i <= complexity; i++) {
    p += blur / float(i) * sin(
        float(i) * p.yx + deltaT + PI * noiseTime
      );
  }
  p += (mouse * mouseSpeed + offset);
  gl_FragColor = vec4(
    (0.9 - baseColor) * vec3(
      sin(vec2(gridX, gridY) * p + vec2(2.0 * noiseSTime, 3.0 * noiseSTime1)),
      sin(p.x + p.y + noiseSTime)
    )
    + baseColor,
    1.0);
}