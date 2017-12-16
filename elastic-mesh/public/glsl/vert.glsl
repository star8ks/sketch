uniform vec3 uGrabCenter;
uniform vec3 uTarget;
uniform float uTime;
uniform float uGrabStart;
uniform float uReleaseStart;
// uniform vec2 uMousePosition;
// uniform vec2 uResolution;
varying vec3 vNorm;
varying vec2 vUv;

#define PI 3.14159
#define initRadius 10.0
#define maxZ 29.0
#define decayExp 2.7
#define upDuration 0.1
#define downDuration 0.8
// the render freq is about 50, so if you want more realistic effect, bounce freq should not like 25.0 / 50.0
#define bounceFreq 12.0

#define dragDistance distance(uTarget, uGrabCenter);

float decay(float f, float n) {
  return exp(-3.0 * pow(abs(f), n));
  // return pow(
  //   cos(f * PI/2.0),
  //   decayExp
  // );
}
float grabForce(vec2 p) {
  float radius = initRadius + 0.1 * distance(uTarget, uGrabCenter.xyz);
  return decay(clamp(distance(p.xy, uGrabCenter.xy) / radius, 0.0, 1.0), decayExp);
}
float shrinkForce(vec2 p) {
  float radius = initRadius + 0.1 * distance(uTarget, uGrabCenter.xyz);
  // return 1.0 - decay(distance(p.xy, uGrabCenter.xy) / radius, decayExp);
  return decay(distance(p.xy, uGrabCenter.xy) / radius, decayExp) / 1.4;
}

void main() {
  vUv = uv;
  float force = grabForce(position.xy);
  // I don't know why (uTarget - position.xyz) here will cause a spike shape
  // vec3 initOffset = (uTarget - position.xyz) * 1.0 * force;
  vec3 initOffset = (uTarget - uGrabCenter.xyz) * 0.95 * force;
  // add translate toward grabCenter for all vertices
  initOffset += (uGrabCenter - position.xyz) * 1.0 * shrinkForce(position.xy);
  vec3 offset;
  if(uReleaseStart > 0.0) {
    float releaseTime = min(uReleaseStart, uTime - uReleaseStart);
    offset = initOffset
      * decay(releaseTime / downDuration, decayExp) * sin(
        clamp(releaseTime / downDuration, 0.0, 1.0) * bounceFreq * (2.0*PI)
      ); // grab release animation
  } else {
    offset = initOffset;
    //* clamp((uTime - uGrabStart) / upDuration, 0.0, 1.0) // grab up animation
  }
  vec3 p = position.xyz + offset;

  vNorm = position.xyz;
  gl_Position = projectionMatrix *
    modelViewMatrix * vec4(p, 1.0);
}