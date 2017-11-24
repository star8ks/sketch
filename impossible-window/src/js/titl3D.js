import { delegate, delegateOnce, clamp } from './util';

let styleAdded = false;
function addStyle() {
  const style = document.createElement('style');
  style.textContent = `.tilt {
      user-select: none;
      will-change: transform;
    }`;
  document.head.appendChild(style);
}

export default function tilt3D(className='tilt', rotateFactor=25) {
  if(!styleAdded) addStyle();
  const originTransforms = new Map();

  delegateOnce(['mouseover', 'touchstart'], className, function (e) {
    originTransforms.set(this, window.getComputedStyle(this)['transform']);
  });
  delegate(['mouseout', 'touchend'], className, function (e) {
    this.style.transform = originTransforms.get(this);
  });

  delegate(['mousemove', 'touchmove'], className, function (e) {
    let target = e.target;
    let offsetX, offsetY;
    if (e.type === 'touchmove') {
      let touch = e.targetTouches[0];
      [offsetX, offsetY] = [
        clamp(touch.clientX - target.offsetLeft, 0, target.clientWidth),
        clamp(touch.clientY - target.offsetTop, 0, target.clientHeight)
      ];
    } else {
      [offsetX, offsetY] = [e.offsetX, e.offsetY];
    }
    let [rotY, rotX] = [
      (0.5 - offsetX / target.clientWidth) * target.clientWidth,
      (offsetY / target.clientHeight - 0.5) * target.clientHeight
    ].map(rotate => rotate * rotateFactor / target.clientWidth);

    // append transforms after origin transform set instead of override
    this.style.transform = originTransforms.get(this)
      + ` perspective(300px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3D(1.1, 1.1, 1.1)`;
  });
}