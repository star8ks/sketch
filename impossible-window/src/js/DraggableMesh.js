import vec3 from 'gl-vec3';
import mat4 from 'gl-mat4';
import {transformDirection, noop} from './util';
import Vector2 from './Vector2';
import Mesh from './Mesh';

class DraggableMesh extends Mesh {
  constructor({rayCaster, globalScope, pointer, endBottomY, error=0.1, onDragging=noop, onDragReach=noop}, ...args) {
    super(...args);
    this.rayCaster = rayCaster;
    this.globalScope = globalScope;
    this.pointer = pointer;
    this.onDragging = onDragging;
    this.onDragReach = onDragReach; // onDragReach will executed when drag to endBottmY
    this.end = {
      bottomY: endBottomY
    };
    this.error = error;

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

    this._draggable(this.globalScope);
  }

  _draggable(scope) {
    let dragStartPosition;
    let needFixBottomY;

    this.pointer.addDownListener((e) => {
      if (!this.enableDrag) return;

      this.rayCaster.setFromOrthographicCamera(e, {
        projectionMatrix: scope.projectionMatrix,
        viewMatrix: scope.viewMatrix
      });

      // TODO: intersect with this.XYPlane
      // TODO: intersect all mesh and return the front mesh
      if (this.rayCaster.intersectMesh(this)) {
        dragStartPosition = this.pointer.position.clone();
        this.dragStartBottomY = this._bottomY;
        this.disableHighlight();
      }
    });

    this.pointer.addUpListener(() => {
      if (!this.enableDrag) return;

      if (dragStartPosition && needFixBottomY) {
        this.disableHighlight();
        this.enableDrag = false;
        this.onDragReach();
      } else {
        this.startHighlight();
      }
      dragStartPosition = undefined;
    });

    this.pointer.addMoveListener((e) => {
      if (!dragStartPosition || !this.enableDrag) return;
      // TODO: if drag end but not success, animate to init bottomY

      needFixBottomY = this.drag(
        new Vector2().subVectors(this.pointer.position, dragStartPosition),
        scope.projectionMatrix,
        scope.viewMatrix
      );
      this.onDragging();
    });

    this.enableDrag = true;


    // console.log(TweenMax, TimelineMax)
    // cube highlight blink
    this.highlightTween = new TweenMax(this, 2, {
      highlight: 2,
      ease: Linear.easeNone,
      repeat: -1, // repeat infinately
      // paused: true,
      yoyo: true  // go back and forth (forward then backward) in every repeat
    });
  }

  startHighlight() {
    this.highlightTween.play();
    this.enableHighlight = true;
  }

  disableHighlight() {
    this.highlightTween.pause();
    this.enableHighlight = false;
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

    // TODO: enable drag in x and z axis to make game more difficult
    if (maxProjAxis === 0) {
    } else if (maxProjAxis === 1) {
      // console.log(maxProj);
      // TODO: set bottomY instead of increase bottomY
      this.bottomY = this.dragStartBottomY + maxProj * 6.2;
      if(Math.abs(this.bottomY - this.end.bottomY) <= this.error) {
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