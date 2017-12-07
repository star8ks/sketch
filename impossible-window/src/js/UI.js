import { $, bind } from './util';

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

const UI = {
  init({ cubeMesh, drawScope, onReversePlaying }) {
    const $replay = $`#replay`;
    TweenLite.defaultEase = Expo.easeIn;
    // animation after click on cube
    UI.timeline = {
      reversePlaying: () => new TimelineMax({ paused: true })
        .to(cubeMesh, 1, cubeMesh.start)
        .add(onReversePlaying),

      success: new TimelineMax({ paused: true })
        .to(drawScope.light1Direction, 1.3, drawScope.end.light1Direction)
        .add('scaleUp', '-=1')
        .to(drawScope, 0.8, {
          viewScale: drawScope.end.viewScale
        }, 'scaleUp')
        .to($replay, 0.8, { top: '.4em' }, 'scaleUp')
        .to('.author', 0.8, { display: 'block', opacity: 1 }, '-=1')
    };

    UI.replayBtn = new ReplayBtn($replay);
  }
};

export default UI;
export {UI, ReplayBtn};