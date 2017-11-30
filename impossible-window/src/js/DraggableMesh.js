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