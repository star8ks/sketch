const mat4 = require('gl-mat4');
const vec3 = require('gl-vec3');

/**
 * fork from
 * https://github.com/regl-project/regl/blob/gh-pages/example/raycast.js
 * https://github.com/greggman/webgl-fundamentals/blob/master/webgl/lessons/resources/dot-product.html
 * see:
 * http://antongerdelan.net/opengl/raycasting.html
 * https://github.com/regl-project/regl/blob/gh-pages/example/raycast.js
 * https://github.com/sketchpunk/FunWithWebGL2/tree/master/lesson_039
 */
class RayCaster {
  constructor(gl) {
    this.gl = gl;

    // ray point and ray direction in world space
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
    console.log('ray: ', this.rayPoint, this.rayDir);
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
      if(t !== null) {
        console.log(this.rayDir, this.rayPoint);
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
   * It does intersection between ray and triangle.
   * With the original version, we had no way of accessing 't'
   * But we really needed that value.
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
      vec3.subtract(tvec, this.rayPoint, tri[0]);
    } else {
      vec3.subtract(tvec, tri[0], this.rayPoint);
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
      out[0] = this.rayPoint[0] + t * this.rayDir[0];
      out[1] = this.rayPoint[1] + t * this.rayDir[1];
      out[2] = this.rayPoint[2] + t * this.rayDir[2];
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
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  getNormalCoord(pos) {
    return [
      pos.x / this.gl.canvas.clientWidth * 2 - 1,
      pos.y / this.gl.canvas.clientHeight * -2 + 1
    ];
  }


  /**
   * set ray from orthographic camera and mouse position
   * @param {MouseEvent} event
   */
  setFromOrthographicCamera(event, { projectionMatrix, viewMatrix, near, far}) {
    // if ((camera && camera.isPerspectiveCamera)) {
    //   this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
    //   this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
    // }

    const pos = RayCaster.getRelativeMousePosition(event);
    // 3d Normalised Device Coordinates
    const normalCoord = this.getNormalCoord(pos);

    const inverseViewProjection = mat4.invert([], mat4.multiply([], projectionMatrix, viewMatrix));
    this.rayPoint = vec3.transformMat4([], [...normalCoord, (near + far) / (near - far)], inverseViewProjection); // set origin in plane of camera
    this.rayDir = transformDirection([0, 0, - 1], mat4.invert([], viewMatrix));
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

    // 4d eye coordinates (Camera as origin) = inverseProjectionMatrix * homogeneous clip coord
    // 4d world space coordinates = inverseViewMatrix * eye coord
    //  = inverseViewProjectionMatrix * homogeneous clip coord
    this.rayPoint = vec3.transformMat4([], [...normalCoord, 0.0], inverseViewProjection);

    // camera position in world space
    const cameraPosition = vec3.transformMat4([], [0, 0, 0], mat4.invert([], viewMatrix));

    // ray direction vector in world space
    this.rayDir = vec3.normalize([], vec3.subtract([], this.rayPoint, cameraPosition));

    // const near = vec3.transformMat4([], [...normalCoord, -1], inverseViewProjection);
    // const far = vec3.transformMat4([], [...normalCoord,  1], inverseViewProjection);
    // console.log({near, far});
    // const ray = vec3.normalize([], vec3.subtract([], far, near));
  }

}


function transformDirection(vector, matrix) {
  var x = vector[0], y = vector[1], z = vector[2];

  return vec3.normalize([], [
    matrix[0] * x + matrix[4] * y + matrix[8] * z,
    matrix[1] * x + matrix[5] * y + matrix[9] * z,
    matrix[2] * x + matrix[6] * y + matrix[10] * z
  ]);
}

export default RayCaster;