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

  constructor({rayCaster, globalScope, pointer, endProperty, endValue, error=0.1, onDragging=noop, onDragReach=noop, onDragFail=noop}, ...args) {
    super(...args);
    this.rayCaster = rayCaster;
    this.globalScope = globalScope;
    this.pointer = pointer;
    this.onDragging = onDragging;
    this.onDragReach = onDragReach; // onDragReach will executed when drag to endBottmY
    this.onDragFail = onDragFail;

    // start status
    this.start = {};
    // end status
    this.end = {
      property: endProperty,
      value: endValue
    };
    this.error = error;

    this._initVertGroup();

    this.XYPlane = this.getPlane(DraggableMesh.DRAG_PLANE.YZ);
    this.children.push(this.XYPlane);

    this._draggable(this.globalScope);
  }

  _initVertGroup() {
    const normalError = 0.01;
    // find all vertex on cube bottom plane
    // if normal.y is -1, the vertex is on bottom face
    this.bottomVerts = this._getVertGroup(normal => {
      return Math.abs(normal[1] + 1) < normalError;
    }, (bottomVert) => {
      this._bottomY = bottomVert[1];
      this.start.bottomY = bottomVert[1];
    });

    this.upVerts = this._getVertGroup(normal => {
      return Math.abs(normal[1] - 1) < normalError;
    }, vert => {
      this._upY = vert[1];
      this.start.upY = vert[1];
    });

    this.frontVerts = this._getVertGroup(normal => {
      return Math.abs(normal[2] - 1) < normalError;
    }, vert => {
      this._frontZ = vert[2];
      this.start.frontZ = vert[2];
    });

    this.backVerts = this._getVertGroup(normal => {
      return Math.abs(normal[2] + 1) < normalError;
    }, vert => {
      this._backZ = vert[2];
      this.start.backZ = vert[2];
    });
  }

  _getVertGroup(findNormal, cb) {
    const index = this.normals.findIndex(findNormal);
    const bottomVert = this.positions[index];
    cb(bottomVert);
    return this.positions.filter(position => Math.abs(position[1] - bottomVert[1]) < 0.01);
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

  get upY() {
    return this._upY;
  }
  set upY(y) {
    this.upVerts.forEach(vert => {
      vert[1] = y;
    });
    this._upY = y;
  }

  get frontZ() {
    return this._frontZ;
  }
  set frontZ(z) {
    this.frontVerts.forEach(vert => {
      vert[2] = z;
    });
    this._frontZ = z;
  }

  get backZ() {
    return this._backZ;
  }
  set backZ(z) {
    this.backVerts.forEach(vert => {
      vert[2] = z;
    });
    this._backZ = z;
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
    let isReached;

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
        this.dragStartUpY = this._upY;
        this.disableHighlight();
      }
    });

    this.pointer.addUpListener(() => {
      if (!this.enableDrag) return;

      if (dragStartPoint) {
        if (isReached) {
          this.disableHighlight();
          this.enableDrag = false;
          // if reached to this.end.value, we need animate to fix error
          TweenMax.to(
            this,
            4 * Math.abs(this[this.end.property] - this.end.value),
            {
              [this.end.property]: this.end.value,
              onComplete: this.onDragReach
            }
          );
        } else {
          this.enableDrag = false;

          if (!this.sameAsStart()) this.onDragFail();
          // if drag end but not reached, animate to start status
          TweenMax.to(this, 0.2, {
            bottomY: this.start.bottomY,
            upY: this.start.upY,
            onComplete: () => {
              this.enableDrag = true;
              this.startHighlight();
            }
          });
        }
      }
      dragStartPoint = undefined;
    });

    this.pointer.addMoveListener((e) => {
      if (!dragStartPoint || !this.enableDrag) return;

      this.rayCaster.setFromOrthographicCamera(e, {
        projectionMatrix: scope.projectionMatrix,
        viewMatrix: scope.viewMatrix
      });
      let intersectPoint = this.rayCaster.intersectMesh(this.XYPlane);
      if (!intersectPoint) return;

      // TODO: determine drag axis on 1st call after drag start
      const dragDirection = vec3.subtract([], intersectPoint, dragStartPoint);
      const dragAxis = this.getDragAxis(dragDirection);
      if (dragAxis && dragAxis[1] !== 0) {
        // TODO: enable drag in x and z axis to make game more difficult
        isReached = this.dragY(intersectPoint[1] - dragStartPoint[1]);
        this.onDragging();
      }
    });

    this.enableDrag = true;

    // cube highlight blink
    this.highlightTween = new TweenMax(this, 2, {
      highlight: 2,
      ease: Linear.easeNone,
      repeat: -1, // repeat infinately
      // paused: true,
      yoyo: true  // go back and forth (forward then backward) in every repeat
    });
  }

  sameAsStart() {
    const keys = Object.keys(this.start);
    for(const key of keys) {
      // console.log(key, this[key], this.start[key], this[key] == this.start[key]);
      if(this[key] !== this.start[key]) return false;
    }
    return true;
  }

  /**
   * TODO: determine drag bottomY or upY
   * @return {Boolean} whether reached this.end.value or not
   */
  dragY(yOffset) {
    const nextBottomY = this.dragStartBottomY + yOffset;
    const nextUpY = this.dragStartUpY + yOffset;
    if (nextBottomY > this.start.bottomY) {
      this.bottomY = this.start.bottomY;
      this.upY = nextUpY;
    } else if (nextUpY < this.start.upY){
      this.upY = this.start.upY;
      this.bottomY = nextBottomY;
    }
    return Math.abs(this[this.end.property] - this.end.value) <= this.error;
  }

  /**
   * Get model coordinate axis
   * @TODO apply this.matrix on axis
   */
  getAxis() {
    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  }

  /**
   * get drag axis and plane to intersect with
   * @param {vec3} dragDirection
   */
  getDragAxis(dragDirection) {
    const axis = this.getAxis();
    const projects = axis.map(ax => vec3.dot(dragDirection, ax));

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

  startHighlight() {
    this.highlightTween.play();
    this.enableHighlight = true;
  }

  disableHighlight() {
    this.highlightTween.pause();
    this.enableHighlight = false;
  }

}

export default DraggableMesh;