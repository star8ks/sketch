const mat4 = require('gl-mat4');
const vec3 = require('gl-vec3');
import {transformDirection} from './util';

/**
 * fork from
 * https://github.com/regl-project/regl/blob/gh-pages/example/raycast.js
 * https://github.com/greggman/webgl-fundamentals/blob/master/webgl/lessons/resources/dot-product.html
 * see:
 * http://antongerdelan.net/opengl/raycasting.html
 * https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-generating-camera-rays/definition-ray
 * https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-generating-camera-rays/generating-camera-rays
 *
 * https://github.com/regl-project/regl/blob/gh-pages/example/raycast.js
 * https://github.com/sketchpunk/FunWithWebGL2/tree/master/lesson_039
 */
class RayCaster {
  constructor(gl, near, far) {
    this.gl = gl;
    this.near = near || 0;
    this.far = far || Infinity;

    // ray origin point and ray direction in world space
    // this.rayPoint = rayPoint;
    // this.rayDir = rayDir;
    // console.log(rayDir);
  }

  sortVerticesCounterClockwise(vertices, origin) {
    origin = origin || [0, 0, 0];
    return vertices.sort(function (a, b) {
      var value1 = Math.atan2(a[2] - origin[2], a[0] - origin[0]);
      var value2 = Math.atan2(b[2] - origin[2], b[0] - origin[0]);
      if (value1 > value2) {
        return 1;
      } else if (value1 < value2) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  /**
   * test if ray intersect with mesh
   * @param {Mesh} mesh
   * @return {Boolean}
   */
  intersectMesh(mesh) {
    console.log('ray: ', this.rayOrigin, this.rayDir);
    // this.rayPoint[2] = 100;
    for (let j = 0; j < mesh.elements.length; j++) {
      const f = mesh.elements[j];

      // The Möller–Trumbore intersection algorithm does require that
      // the triangle vertices be passed in counter-clockwise order
      const tri = this.sortVerticesCounterClockwise([
        // we test intersect in world space
        // so we need apply model matrix on the triangle.
        vec3.transformMat4([], mesh.positions[f[0]], mesh.matrix),
        vec3.transformMat4([], mesh.positions[f[1]], mesh.matrix),
        vec3.transformMat4([], mesh.positions[f[2]], mesh.matrix)
      ]);
      // console.log('tri', tri);

      const t = this.intersectTriangle(tri);
      if(t !== null && t >= this.near && t <= this.far) {
        console.log(this.rayDir, this.rayOrigin);
        console.log([
          vec3.transformMat4([], mesh.positions[f[0]], mesh.matrix),
          vec3.transformMat4([], mesh.positions[f[1]], mesh.matrix),
          vec3.transformMat4([], mesh.positions[f[2]], mesh.matrix)
        ]);
        console.log('tri intersect', t, mesh.positions[f[0]], mesh.positions[f[1]], mesh.positions[f[2]]);
        return true;
      }
    }

    return false;
  }

  /**
   * Below is a slightly modified version of this code:
   * https://github.com/substack/ray-triangle-intersection
   * Calculate the intersection of a ray and a triangle in three dimensions
   * using the Möller-Trumbore intersection algorithm with culling enabled
   *
   * It does intersection between ray and triangle.
   * With the original version, we had no way of accessing 't'
   * But we really needed that value.
   *
   * @param {vec3[3]} tri
   * @param {vec3} out
   * @return {Number|null}
   */
  intersectTriangle(tri, out=[]) {
    const EPSILON = 0.000001;
    let edge1 = [0, 0, 0];
    let edge2 = [0, 0, 0];
    let tvec = [0, 0, 0];
    let pvec = [0, 0, 0];
    let qvec = [0, 0, 0];

    vec3.subtract(edge1, tri[1], tri[0]);
    vec3.subtract(edge2, tri[2], tri[0]);

    vec3.cross(pvec, this.rayDir, edge2);
    let det = vec3.dot(edge1, pvec);
    if(det > 0) {
      vec3.subtract(tvec, this.rayOrigin, tri[0]);
    } else {
      vec3.subtract(tvec, tri[0], this.rayOrigin);
      det *= -1;
    }
    if (det < EPSILON && det > -EPSILON) return null;

    // vec3.subtract(tvec, this.rayPoint, tri[0]);
    const u = vec3.dot(tvec, pvec);
    if (u < 0 || u > det) return null;
    // if (u < 0 || u > 1) return null;

    vec3.cross(qvec, tvec, edge1);
    const v = vec3.dot(this.rayDir, qvec);
    if (v < 0 || u + v > det) return null;
    // if (v < 0 || u + v > 1) return null;

    let t = vec3.dot(edge2, qvec) / det;
    console.log(vec3.dot(edge2, qvec), det);

    if(t > EPSILON) {
      out[0] = this.rayOrigin[0] + t * this.rayDir[0];
      out[1] = this.rayOrigin[1] + t * this.rayDir[1];
      out[2] = this.rayOrigin[2] + t * this.rayDir[2];
      return t;
    } else {
      return false;
    }
  }

  /**
   * return 2d viewport space coordinates(mouse position relateive to event target)
   * @param {MouseEvent} event
   * @param {EventTarget} target
   */
  static getRelativeMousePosition(event, target) {
    target = target || event.target;
    const rect = target.getBoundingClientRect();

    let clientX, clientY;
    if (event.touches) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  getNormalCoord(pos) {
    return [
      pos.x / this.gl.canvas.clientWidth * 2 - 1,
      pos.y / this.gl.canvas.clientHeight * -2 + 1
    ];
  }

  /**
   * set ray from perspective camera and mouse position
   * @param {MouseEvent} event
   */
  setFromPerspectiveCamera(event, {projectionMatrix, viewMatrix}) {
    const pos = RayCaster.getRelativeMousePosition(event);
    // 3d Normalised Device Coordinates
    const normalCoord = this.getNormalCoord(pos);

    const inverseViewProjection = mat4.invert([], mat4.multiply([], projectionMatrix, viewMatrix));
    // 4d Homogeneous Clip Coordinates(gl_Position)
    // we do not need to reverse perspective division here
    // because this is a ray with no intrinsic depth.
    // const clipCoord = [...normalCoord, -1, 1];
    console.log('4d Homogeneous Clip Coordinates: ', [...normalCoord, -1, 1]);

    // 4d eye space coordinates (Camera as origin) = inverseProjectionMatrix * homogeneous clip coord
    // 4d world space coordinates = inverseViewMatrix * eye coord
    //  = inverseViewProjectionMatrix * homogeneous clip coord
    // Why [...normalCoord, 0.5] ? See http://barkofthebyte.azurewebsites.net/post/2014/05/05/three-js-projecting-mouse-clicks-to-a-3d-scene-how-to-do-it-and-how-it-works
    this.rayOrigin = vec3.transformMat4([], [...normalCoord, 0.5], inverseViewProjection);

    // camera position in world space
    const cameraPosition = vec3.transformMat4([], [0, 0, 0], mat4.invert([], viewMatrix));

    // ray direction vector in world space
    // ray direction = ray origin point - camera position
    this.rayDir = vec3.normalize([], vec3.subtract([], this.rayOrigin, cameraPosition));

    // const near = vec3.transformMat4([], [...normalCoord, -1], inverseViewProjection);
    // const far = vec3.transformMat4([], [...normalCoord,  1], inverseViewProjection);
    // console.log({near, far});
    // const ray = vec3.normalize([], vec3.subtract([], far, near));
  }

  /**
   * set ray from orthographic camera and mouse position
   * adapt from: https://github.com/mrdoob/three.js/blob/r88/src/core/Raycaster.js#L83
   * Currently I cannot completely understand why but it works.
   * @param {MouseEvent} event
   */
  setFromOrthographicCamera(event, { projectionMatrix, viewMatrix, near=this.near, far=this.far }) {
    const pos = RayCaster.getRelativeMousePosition(event);
    // 3d Normalised Device Coordinates
    const normalCoord = this.getNormalCoord(pos);

    const inverseViewProjection = mat4.invert([], mat4.multiply([], projectionMatrix, viewMatrix));
    // Why ray origin point is not -1(near clipping plane), but ] ?
    // (near + far) / (near - far) is about -0.9
    this.rayOrigin = vec3.transformMat4([], [...normalCoord, (near + far) / (near - far)], inverseViewProjection); // set origin in plane of camera

    // This is a transform from eye space to world space, for orthographic projection,
    // mouse ray direction is always [0, 0, -1]
    this.rayDir = vec3.normalize([], transformDirection([0, 0, -1], mat4.invert([], viewMatrix)));
  }

}

export default RayCaster;
