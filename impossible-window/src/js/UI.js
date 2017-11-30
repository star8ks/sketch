import { bind } from './util';

class ReplayBtn {
  constructor(el) {
    this.el = el;
    bind(el, ['mousedown', 'mouseout', 'touchend'], function () {
      new TweenMax(this, 1, {
        textShadow: "0px 0px 0px rgba(0,0,0,0)"
      });
    });
    bind(el, ['mouseout', 'touchend'], function () {
      new TweenMax(this, 1, {
        opacity: 0.6
      });
    });
    bind(el, ['mouseover', 'touchstart'], function () {
      new TweenMax(this, .5, {
        opacity: 0.9,
        textShadow: "-1vh 1vh 1px rgba(168, 2, 40, 0.5)",
        ease: Linear.easeInOut
      });
    });
  }

  onClick(handler) {
    bind(this.el, 'click', handler, false);
  }
}

export {ReplayBtn};