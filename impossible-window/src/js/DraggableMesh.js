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
  static vertexCompareError = 0.01;

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

    this.YZPlane = this.getPlane(DraggableMesh.DRAG_PLANE.YZ);
    this.XZPlane = this.getPlane(DraggableMesh.DRAG_PLANE.XZ);
    this.children.push(this.YZPlane);
    this.children.push(this.XZPlane);

    this._draggable(this.globalScope);
  }

  _initVertGroup() {
    // find all vertex on cube bottom plane
    // if normal.y is -1, the vertex is on bottom face
    this.bottomVerts = this._getVertGroup(1, normal => {
      return Math.abs(normal[1] + 1) < DraggableMesh.vertexCompareError;
    }, (bottomVert) => {
      this._bottomY = bottomVert[1];
      this.start.bottomY = bottomVert[1];
    });

    this.upVerts = this._getVertGroup(1, normal => {
      return Math.abs(normal[1] - 1) < DraggableMesh.vertexCompareError;
    }, vert => {
      this._upY = vert[1];
      this.start.upY = vert[1];
    });

    this.frontVerts = this._getVertGroup(2, normal => {
      return Math.abs(normal[2] - 1) < DraggableMesh.vertexCompareError;
    }, vert => {
      this._frontZ = vert[2];
      this.start.frontZ = vert[2];
    });

    this.backVerts = this._getVertGroup(2, normal => {
      return Math.abs(normal[2] + 1) < DraggableMesh.vertexCompareError;
    }, vert => {
      this._backZ = vert[2];
      this.start.backZ = vert[2];
    });

    // console.log('bottom', this.bottomVerts);
    // console.log('up', this.upVerts);

    // console.log('front', this.frontVerts);
    // console.log('back', this.backVerts);
  }

  _getVertGroup(index, findNormal, cb) {
    const normalIndex = this.normals.findIndex(findNormal);
    const vertex = this.positions[normalIndex];
    cb(vertex);
    return this.positions.filter(position => Math.abs(position[index] - vertex[index]) < DraggableMesh.vertexCompareError);
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
      cells: constraintPlane.indices,
      center: this.geometryCenter
    });
    constraintMesh.alpha = 0.4;
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
    let dragStartPointXZ, dragStartPointYZ;
    // wait for 3 pointer move handler call to trigger drag direction compute
    const judgeDirectionWait = 3;
    // judgeDirection will be set to judgeDirectionWait when click down at this DraggableMesh
    // after that, for each call of pointer's move handler, we decrease judgeDirection by 1,
    // if judgeDirection > 1, we don't actrually modify vertices' position
    // if judgeDirection === 1, we need compute drag direction and drag axis
    // if judgeDirection < 1, the drag direction is fixed, and we can drag vertices
    let judgeDirection = 0;
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
        dragStartPointXZ = this.rayCaster.intersectMesh(this.XZPlane);
        dragStartPointYZ = this.rayCaster.intersectMesh(this.YZPlane);
        judgeDirection = judgeDirectionWait;
        this.dragStartBottomY = this._bottomY;
        this.dragStartUpY = this._upY;
        this.dragStartBackZ = this._backZ;
        this.dragStartFrontZ = this._frontZ;

        this.disableHighlight();
      }
    });

    this.pointer.addUpListener(() => {
      if (!this.enableDrag) return;

      if (dragStartPointYZ) {
        if (isReached) {
          this.disableHighlight();
          this.enableDrag = false;

          // if reached to this.end.value, we need animate to fix error
          TweenMax.to(
            this,
            4 * Math.abs(this[this.end.property] - this.end.value),
            { [this.end.property]: this.end.value },
          ).eventCallback('onComplete', this.onDragReach);

        } else {
          this.enableDrag = false;

          if (!this.sameAsStart()) this.onDragFail();
          // if drag end but not reached, animate to start status
          // Not simply do TweenMax.to(this, 0.2, this.start) here,
          // because TweenMax.to().eventCallback will add property like onComplete and onCompleteParams on this.start
          TweenMax.to(this, 0.2, Object.assign({}, this.start)).eventCallback('onComplete', () => {
            this.enableDrag = true;
            this.startHighlight();
          });
        }
      }
      dragStartPointYZ = undefined;
      judgeDirection = 0;
    });

    let dragDirection, dragDirectionYZ, dragDirectionXZ;
    this.pointer.addMoveListener((e) => {
      if (!dragStartPointXZ || !dragStartPointYZ || !this.enableDrag) return;
      if (judgeDirection > 0) {
        judgeDirection--;
        return;
      }

      this.rayCaster.setFromOrthographicCamera(e, {
        projectionMatrix: scope.projectionMatrix,
        viewMatrix: scope.viewMatrix
      });
      let intersectPointXZ = this.rayCaster.intersectMesh(this.XZPlane);
      let intersectPointYZ = this.rayCaster.intersectMesh(this.YZPlane);
      if (!intersectPointXZ || !intersectPointYZ) return;

      // determine drag axis on 1st call after drag start
      dragDirectionXZ = vec3.subtract([], intersectPointXZ, dragStartPointXZ);
      dragDirectionYZ = vec3.subtract([], intersectPointYZ, dragStartPointYZ);
      if (judgeDirection === 0) {
        // important to normalize them, otherwise won't get right drag axis
        const nxz = vec3.normalize([], dragDirectionXZ);
        const nyz = vec3.normalize([], dragDirectionYZ);
        dragDirection = [nxz[0], nyz[1], nyz[2]];
        judgeDirection--;
      }
      const dragAxis = this.getDragAxis(dragDirection);

      isReached = this.drag(dragAxis, dragDirectionXZ, dragDirectionYZ);
      this.onDragging();
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
    for (const key of keys) {
      if (typeof this.start[key] !== 'number') continue;

      if (Math.abs(this[key] - this.start[key]) > DraggableMesh.vertexCompareError) {
        return false;
      }
    }
    return true;
  }

  // TODO: enable drag in x and z axis to make game more difficult
  drag(axis, xz, yz) {
    console.log('drag axis: ', axis);
    let offset;
    if(axis == 0) {
      offset = xz[0];
      // this.dragX(offset);
    } else if (axis === 1) {
      offset = yz[1];
      this.dragY(offset);
    } else if (axis === 2) {
      offset = xz[2];
      this.dragZ(offset);
    }
    return Math.abs(this[this.end.property] - this.end.value) <= this.error;
  }

  /**
   * @return {Boolean} whether reached this.end.value or not
   */
  dragY(offset) {
    const nextBottomY = this.dragStartBottomY + offset;
    const nextUpY = this.dragStartUpY + offset;
    if (nextBottomY > this.start.bottomY) {
      this.bottomY = this.start.bottomY;
      this.upY = nextUpY;
    } else if (nextUpY < this.start.upY) {
      this.upY = this.start.upY;
      this.bottomY = nextBottomY;
    }
  }

  dragZ(offset) {
    const nextBackZ = this.dragStartBackZ + offset;
    const nextFrontZ = this.dragStartFrontZ + offset;
    if (nextBackZ > this.start.backZ) {
      this.backZ = this.start.backZ;
      this.frontZ = nextFrontZ;
    } else if (nextFrontZ < this.start.frontZ) {
      this.frontZ = this.start.frontZ;
      this.backZ = nextBackZ;
    }
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
   * @return {Number} 0 for x axis, 1 for y, 2 for z
   */
  getDragAxis(dragDirection) {
    const axis = this.getAxis();
    const projects = axis.map(ax => vec3.dot(dragDirection, ax));

    let maxProjAxis, maxProjAbs=0;//, maxProj;
    projects.forEach((proj, axis) => {
      const abs = Math.abs(proj);
      if(abs > maxProjAbs) {
        maxProjAbs = abs;
        // maxProj = proj;
        maxProjAxis = axis;
      }
    });

    // if (maxProjAxis === 0) {
    // } else if (maxProjAxis === 1) {
    //   return [0, Math.sign(maxProj), 0];
    // } else if (maxProjAxis === 2) {
    // }
    return maxProjAxis;
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