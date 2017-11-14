function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const util = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  clamp: clamp,
};

export default util;
export {
  clamp
}