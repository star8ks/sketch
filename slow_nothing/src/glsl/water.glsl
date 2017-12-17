precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;

const int   complexity      = 10; // More points of color.
const float mouse_factor    = 0.03; // Makes it more/less jumpy.
const float mouse_offset    = 0.7;  // Drives complexity in the amount of curls/cuves.  Zero is a single whirlpool.
const float fluid_speed     = 1.9;  // Drives speed, smaller number will make it slower.
const float color_intensity = 0.7;
const float blur            = 0.6;
const float gridX           = 2.0;
const float gridY           = 2.0;

#define PI 3.14159

// see http://devmaster.net/forums/topic/4648-fast-and-accurate-sinecosine/
float sinApprox(float x) {
  x = PI + (2.0 * PI) * floor(x / (2.0 * PI)) - x;
  return (4.0 / PI) * x - (4.0 / PI / PI) * x * abs(x);
}
float cosApprox(float x) {
  return sinApprox(x + 0.5 * PI);
}

// more about noise: 
// http://thebookofshaders.com/11/
float random(float x) {
  return fract(sinApprox(x) * 127475.371529);
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
  for(int i=1; i <= complexity; i++) {
    p += blur / float(i) * vec2(
      sinApprox(
        float(i) * p.y + time*fluid_speed + PI * noise(time)
      ),
      sinApprox(
        float(i) * p.x + time*fluid_speed + PI * noise(time)
      )
    )
    + mouse * mouse_factor + mouse_offset;
  }
  gl_FragColor = vec4(
    color_intensity * sinApprox(gridX * p.x + noiseS(time)) + color_intensity,
    color_intensity * sinApprox(gridY * p.y + noiseS(time + 1.0)) + color_intensity,
    color_intensity * sinApprox(p.x + p.y + time) + color_intensity,
    1.0);
}