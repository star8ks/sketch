const THREE = require('three');

function fract(x) {
  return x - Math.floor(x);
}

class Random{
  constructor(randomSeed=138472) {
    this.randomSeed = randomSeed;
  }

  get(x) {
    return fract(Math.sin(x) * this.randomSeed);
  }

  // return a smooth random between min and max
  getBetween(x, min, max) {
    const i = Math.floor(x);
    const f = x - i;
    return THREE.Math.lerp(
      this.get(i), this.get(i + 1.0), THREE.Math.smoothstep(f, 0., 1.)
    ) * (max - min) + min;
  }
}

module.exports = Random;