import Vector2 from './Vector2';
import {clamp} from './util';

class Pointer {
  constructor(domElement, { scaleMin = 0.01, scaleMax = 10.0, pressureMax = 1.0, pressureDuration = 1000 } = {}) {
    if (Pointer.instance) {
      return Pointer.instance;
    }

    this.dom = domElement;
    this.opt = { scaleMin, scaleMax, pressureMax, pressureDuration };
    this.pressCheckInterval = 20;
    this.deltaPressure = this.opt.pressureMax / this.opt.pressureDuration * this.pressCheckInterval;

    this.position = new Vector2();
    this.zoomSpeed = 1.0;
    this.scale = 1.0;
    this.dollyStart = new Vector2();
    this.dollyEnd = new Vector2();
    this.dollyDelta = new Vector2();

    this.addMoveListener(this.onMove.bind(this));
    this.addDownListener(this.onDown.bind(this));
    this.addUpListener(this.onUp.bind(this));

    this.dom.addEventListener('touchstart', this._onTouchZoomStart, false);
    this.addZoomListener(this.onZoom.bind(this));
    this.isPressing = false;
    this.pressure = 0.0;

    Pointer.instance = this;
  }

  get zoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }
  setScale(val) {
    this.scale = clamp(val, this.opt.scaleMin, this.opt.scaleMax);
  }

  updatePosition(clientX, clientY) {
    let size = Math.min(this.dom.clientWidth, this.dom.clientHeight);
    let {x: oldX, y: oldY} = this.position;
    this.position.x = (clientX * 2 - this.dom.clientWidth) / size;
    this.position.y = ((this.dom.clientHeight - clientY) * 2 - this.dom.clientHeight) / size;
    this.dx = (this.position.x - oldX);
    this.dy = (this.position.y - oldY);
    this.clientX = clientX;
    this.clientY = clientY;
  }

  onMove(e) {
    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
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

  setPressure(val) {
    let valid = val <= this.opt.pressureMax && val >= 0.0;
    this.pressure = clamp(val, 0.0, this.opt.pressureMax);
    //   console.log(this.pressure);
    return valid;
  }
  onDown(e) {
    if (e instanceof MouseEvent && e.button !== Pointer.BUTTON.MOUSE_LEFT) {
      return;
    }

    this.isPressing = true;
    if (e.touches) {
      let x = e.touches[0].clientX;
      let y = e.touches[0].clientY;
      this.updatePosition(x, y);
    }


    let intervalID = setInterval(() => {
      if (!this.isPressing || !this.setPressure(this.pressure + this.deltaPressure)) {
        clearInterval(intervalID);
      }
    }, this.pressCheckInterval);

    let pressingTest = setInterval(() => {
      if(this.isPressing) {
        var event = new CustomEvent('Pointer.pressing', { detail: this.pressure });
        this.dom.dispatchEvent(event);
      } else {
        clearInterval(pressingTest);
      }
    }, this.pressCheckInterval);
  }
  addDownListener(cb) {
    ['mousedown', 'touchstart'].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  addPressingListener(cb) {
    ['Pointer.pressing', 'Pointer.postpressing'].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }
  addPressingUpListener(cb) {
    this.dom.addEventListener('Pointer.postpressing', cb, false);
  }
  addPressingEndListener(cb) {
    this.dom.addEventListener('Pointer.pressingEnd', cb, false);
  }

  onUp(e) {
    if (e instanceof MouseEvent && e.button !== Pointer.BUTTON.MOUSE_LEFT) {
      return;
    }

    this.isPressing = false;
    let intervalID = setInterval(() => {
      if (this.isPressing || !this.setPressure(this.pressure - this.deltaPressure)) {
        var event = new CustomEvent('Pointer.pressingEnd', { detail: this.pressure });
        this.dom.dispatchEvent(event);
        clearInterval(intervalID);
      } else {
        var event = new CustomEvent('Pointer.postpressing', { detail: this.pressure });
        this.dom.dispatchEvent(event);
      }
    }, this.pressCheckInterval);
  }
  addUpListener(cb) {
    ['mouseup', 'touchend'].forEach(evtName => {
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  _onTouchZoomStart(e) {
    if (e.touches.length !== 2) return;
    let dx = e.touches[0].pageX - e.touches[1].pageX;
    let dy = e.touches[0].pageY - e.touches[1].pageY;
    this.dollyStart.set(0, Math.sqrt(dx * dx + dy * dy));
  }
  _onTouchZoom(e) {
    var dx = e.touches[0].pageX - e.touches[1].pageX;
    var dy = e.touches[0].pageY - e.touches[1].pageY;
    this.dollyEnd.set(0, Math.sqrt(dx * dx + dy * dy));

    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
    if (dollyDelta.y > 0) {
      this.zoomOut();
    } else if (dollyDelta.y < 0) {
      this.zoomIn();
    }

    this.dollyStart.copy(this.dollyEnd);
  }
  _onWheelZoom(e) {
    if (e.deltaY > 0) {
      this.zoomOut();
    } else if (e.deltaY < 0) {
      this.zoomIn();
    }
    e.preventDefault(); // prevent page scroll down
  }
  onZoom(e) {
    if (e.touches) {
      this._onTouchZoom(e);
    } else {
      this._onWheelZoom(e);
    }
  }
  addZoomListener(cb) {
    ['wheel', 'touchmove'].forEach(evtName => {
      if (evtName === 'touchmove') {
        cb = (e) => {
          return e.touches.length === 2 ? cb(e) : undefined;
        }
      }
      this.dom.addEventListener(evtName, cb, false);
    });
  }

  zoomIn(scaleFactor = this.zoomScale) {
    this.setScale(this.scale * scaleFactor);
  }
  zoomOut(scaleFactor = this.zoomScale) {
    this.setScale(this.scale / scaleFactor);
  }
}
Pointer.instance = null;
Pointer.BUTTON = {
  MOUSE_LEFT: 0,
  MOUSE_MIDDLE: 1,
  MOUSE_RIGHT: 2
}

export default Pointer;