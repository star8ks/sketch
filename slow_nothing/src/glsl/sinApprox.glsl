// http://glslsandbox.com/e#43361.0
// by @301z
// based on http://devmaster.net/forums/topic/4648-fast-and-accurate-sinecosine/

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;

const float Pi = 3.14159;

float sinApprox(float x) {
    x = Pi + (2.0 * Pi) * floor(x / (2.0 * Pi)) - x;
    return (4.0 / Pi) * x - (4.0 / Pi / Pi) * x * abs(x);
}

float cosApprox(float x) {
    return sinApprox(x + 0.5 * Pi);
}

#define SCALE 2.0
void main() {
  vec2 p = ((2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y) + vec2(1.0, 0)) * SCALE;
  float t = 0.5 * Pi;
  float s = (sinApprox(p.x) + 0.0);
  float c = (cosApprox(p.x * t) * t) * 0.5;
  gl_FragColor = vec4(vec3((s - p.y) * 59.), 1.0);

    // float x = gl_FragCoord.x / resolution.x, t = 4.0 * Pi;
    // float s = (sinApprox(x * t) * 0.25 + 0.5) * resolution.y;
    // float c = (cosApprox(x * t) * t) * 0.25 * resolution.y / resolution.x;
    // gl_FragColor = vec4(vec3(abs(s - gl_FragCoord.y) / sqrt(1.0 + c * c) - 0.1), 1.0);
}
