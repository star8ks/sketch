const m4 = require('gl-mat4');

/**
 * fork from https://github.com/greggman/webgl-fundamentals/blob/master/webgl/lessons/resources/dot-product.html
 *
 */
class RayCaster {
  constructor() {

  }

  static getRelativeMousePosition(event, target) {
    target = target || event.target;
    let rect = target.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  getMouseRay(event, gl, inverseViewProjection) {
    let pos = RayCaster.getRelativeMousePosition(event);
    let clipX = pos.x / gl.canvas.clientWidth  *  2 - 1;
    let clipY = pos.y / gl.canvas.clientHeight * -2 + 1;
    let near = transformPoint(inverseViewProjection, [clipX, clipY, -1]);
    let far  = transformPoint(inverseViewProjection, [clipX, clipY,  1]);
    let ray  = v3.normalize(v3.subtract(far, near));
    return {
      near: near,
      far: far,
      ray: ray,
    };
  }

}

export default RayCaster;