import vec3 from 'gl-vec3';
import mat4 from 'gl-mat4';
import {transformDirection, noop} from './util';
import Vector2 from './Vector2';
import Mesh from './Mesh';
import PlaneBufferGeometry from './PlaneBufferGeometry';

class DraggableMesh extends Mesh {
  static DRAG_PLANE = {
    XY: Symbol(),
    XZ: Symbol(),
    YZ: Symbol()
  };

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

    this.bottomVerts = this.positions.filter(position =>
      Math.abs(position[1] - bottomVert[1]) < 0.01
    );

    this._bottomY = bottomVert[1];
    this.initBottomY = bottomVert[1];

    this.XYPlane = this.getPlane(DraggableMesh.DRAG_PLANE.YZ);
    this.children.push(this.XYPlane);

    this._draggable(this.globalScope);
  }

  /**
   * get axis aligned mesh for intersecting with mouse ray
   */
  getPlane(type = DraggableMesh.DRAG_PLANE.XY) {
    let constraintPlane = new PlaneBufferGeometry({ width: 10, height: 10 });
    let constraintMesh = new Mesh(this.regl, {
      positions: constraintPlane.vertices,
      normals: constraintPlane.normals,
      cells: constraintPlane.indices
    }, this.geometryCenter);
    // constraintMesh.alpha = 0.4;
    constraintMesh.visible = false;

    switch (type) {
      case DraggableMesh.DRAG_PLANE.XZ:
        mat4.rotateX(constraintMesh.matrix, constraintMesh.matrix, Math.PI / 2);
        break;
      case DraggableMesh.DRAG_PLANE.YZ:
        mat4.rotateY(constraintMesh.matrix, constraintMesh.matrix, Math.PI / 2);
        break;

    }
    return constraintMesh;
  }

  _draggable(scope) {
    let dragStartPoint;
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
        dragStartPoint = this.rayCaster.intersectMesh(this.XYPlane);
        this.dragStartBottomY = this._bottomY;
        this.disableHighlight();
      }
    });

    this.pointer.addUpListener(() => {
      if (!this.enableDrag) return;

      if (dragStartPoint && needFixBottomY) {
        this.disableHighlight();
        this.enableDrag = false;
        this.onDragReach();
      } else {
        this.startHighlight();
      }
      dragStartPoint = undefined;
    });

    this.pointer.addMoveListener((e) => {
      if (!dragStartPoint || !this.enableDrag) return;
      // TODO: if drag end but not success, animate to init bottomY

      this.rayCaster.setFromOrthographicCamera(e, {
        projectionMatrix: scope.projectionMatrix,
        viewMatrix: scope.viewMatrix
      });
      let intersectPoint = this.rayCaster.intersectMesh(this.XYPlane);
      if (!intersectPoint) return;

      // TODO: use this.getDragAxis to determine drag bottomY or upY
      // TODO: enable drag in x and z axis to make game more difficult
      needFixBottomY = this.dragBottomY(intersectPoint[1] - dragStartPoint[1]);
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
   * Get model coordinate axis
   * @TODO apply this.matrix on axis
   */
  getAxis() {
    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  }

  /**
   * @return {Boolean} whether reached then.end.bottomY or not
   */
  dragBottomY(yOffset) {
    this.bottomY = this.dragStartBottomY + yOffset;
    if (Math.abs(this.bottomY - this.end.bottomY) <= this.error) {
      return true;
    }
    return false;
  }

  /**
   * get drag axis and plane to intersect with
   * @param {vec3} dragDirection
   */
  getDragAxis(dragDirection) {
    const axis = this.getAxis();
    const projects = axis.map(ax => dragDirection.dot(ax));

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
      return [0, Math.sign(maxProj), 0];
    } else if (maxProjAxis === 2) {
    }
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