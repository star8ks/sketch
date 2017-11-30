import vec3 from 'gl-vec3';
import mat4 from 'gl-mat4';
import {transformDirection} from './util';
import Vector2 from './Vector2';
import Mesh from './Mesh';

class DraggableMesh extends Mesh {
  constructor({endBottomY}, ...args) {
    super(...args);
    this.end = {
      bottomY: endBottomY
    };

    // find all vertex on cube bottom plane
    // if normal.y is -1, the vertex is on bottom face
    const bottomIndex = this.normals.findIndex(function(normal) {
      return Math.abs(normal[1] + 1) < 0.01;
    });
    const bottomVert = this.positions[bottomIndex];

    this.bottomVerts = this.positions.filter((position, index) =>
      Math.abs(position[1] - bottomVert[1]) < 0.01
    );

    this._bottomY = bottomVert[1];
    this.initBottomY = bottomVert[1];
    this.enableDrag = true;
  }

  /**
   * Get model coordinate axis that transformed to clip space
   * @param {mat4} viewProjectionMatrix
   */
  getAxis(viewProjectionMatrix) {
    const matrix = mat4.multiply([], this.matrix, viewProjectionMatrix);
    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(axis => {
      // axis in clip space
      const clip = transformDirection(axis, matrix);
      return new Vector2(clip[0], clip[1]).normalize();
    });
  }

  drag(dragDirection, projectionMatrix, viewMatrix) {
    if(!this.enableDrag) return;

    // const moveDirection = new Vector2(dx, dy).normalize();
    const axis = this.getAxis(mat4.multiply([], projectionMatrix, viewMatrix));
    const projects = axis.map(clip => dragDirection.dot(clip));

    let maxProjAxis, maxProjAbs=0, maxProj;
    projects.forEach((proj, axis) => {
      const abs = Math.abs(proj);
      if(abs > maxProjAbs) {
        maxProjAbs = abs;
        maxProj = proj;
        maxProjAxis = axis;
      }
    });

    if (maxProjAxis === 0) {
    } else if (maxProjAxis === 1) {
      // console.log(maxProj);
      this.bottomY += maxProj * 0.2;
      if(this.bottomY - this.end.bottomY <= 0.1) {
        this.enableDrag = false;
        return true;
      }
    } else if (maxProjAxis === 2) {
    }

    return false;
  }

  get bottomY() {
    return this._bottomY;
  }

  set bottomY(y) {
    this.bottomVerts.forEach(vert => {
      vert[1] = y;
    });
    this._bottomY = y;
  }
}

export default DraggableMesh;