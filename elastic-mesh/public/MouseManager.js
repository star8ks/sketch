const THREE = require('three');

class MouseManager {
  constructor(domElement) {
    if(MouseManager.instance) {
      return MouseManager.instance;
    }
    
    this.dom = domElement;
    this.position = new THREE.Vector2(0, 0);
    
    this.addMoveListener(this.onMove.bind(this));
    this.addDownListener(this.onDown.bind(this));
    this.addUpListener(this.onUp.bind(this));
    this.isPressing = false;

    MouseManager.instance = this;
  }
  
  updatePosition(clientX, clientY) {
    this.position.x = (clientX / this.dom.clientWidth) * 2 - 1;
    this.position.y = -(clientY / this.dom.clientHeight) * 2 + 1;
  }

  onMove(e) {
    let x,y;
    if (e.targetTouches) {
      // e.preventDefault();
      // console.log('touchmove');
      x = e.targetTouches[0].clientX;
      y = e.targetTouches[0].clientY;
      // console.log(x,y);
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    this.updatePosition(x, y);
    // e.preventDefault();
  }
  addMoveListener(cb) {
    ['mousemove', 'touchmove'].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  onDown(e) {
    this.isPressing = true;
    if(e.targetTouches) {
      let x = e.targetTouches[0].clientX;
      let y = e.targetTouches[0].clientY;
      this.updatePosition(x, y);
      // console.log('touchstart', e.targetTouches[0].clientX, e.targetTouches[0].clientX)
    };
  }
  addDownListener(cb) {
    ["mousedown", "touchstart"].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  onUp(e) {
    if(e.targetTouches) {
      // console.log('touchend');
    }
    this.isPressing = false;
  }
  addUpListener(cb) {
    ["mouseup", "touchend"].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  addLeaveListener(cb) {
    this.dom.addEventListener('mouseleave', cb, false);
  }

}
MouseManager.instance = null;

module.exports = MouseManager;