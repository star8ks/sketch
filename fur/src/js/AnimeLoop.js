// main visibility API function
// use visibility API to check if current tab is active or not
// see: https://greensock.com/forums/topic/10051-animations-pause-when-browser-tab-is-not-visible/
const vis = (function () {
  let stateKey,
    eventKey,
    keys = {
      hidden: "visibilitychange",
      webkitHidden: "webkitvisibilitychange",
      mozHidden: "mozvisibilitychange",
      msHidden: "msvisibilitychange"
    };
  for (stateKey in keys) {
    if (stateKey in document) {
      eventKey = keys[stateKey];
      break;
    }
  }
  return function (c) {
    if (c) document.addEventListener(eventKey, c);
    return !document[stateKey];
  }
})();

/**
 * Animation Loop
 * Just like normal animation loop, but it
 * ensure run time consistency and right delta time (which may affect your animation speeed),
 * when your canvas' visiability is changing.
 */
class AnimeLoop {
  constructor(loop) {
    this.loop = loop;
    this._isPause = false; // is puased by this.pause()
    this._isFocus = true;
    this._shouldFixDeltaTime = false;
    this.frameCount = 0;
    this.runTime = 0; // in millisecond

    vis(function () {
      // console.log('vis changed to:', document.visibilityState);
      if (vis()) {
        this._shouldFixDeltaTime = true;
        this._isFocus = true;
      } else {
        this._isFocus = false;
      }
    }.bind(this));
    this.start();
  }

  /**
   * 1. only if this._isFoucus===true, we start request frame with same lastTime and time(make deltaTime not affected by focus losing);
   * 2. if this._isFoucus===false, it does not do anything
   * 3. no matter what value this._isPause is, we request frame and run this.loop
   */
  start() {
    if (!this._isFocus) return;
    this._isPause = false;

    this.lastTime = AnimeLoop.now();
    requestAnimationFrame(function _loop(...args) {
      // console.log('is focus: ', this._isFocus);
      const time = AnimeLoop.now();
      let deltaTime;
      if (this._shouldFixDeltaTime) {
        // console.warn('should fix, is focus: ', this._isFocus);
        deltaTime = AnimeLoop.fixedDeltaTime;
        this._shouldFixDeltaTime = false;
      } else {
        deltaTime = time - this.lastTime;
      }
      this.lastTime = time;
      this.runTime += deltaTime;

      if (!this._isPause) {
        this.loop(deltaTime, ...args);
        this.frameCount++;
        requestAnimationFrame(_loop.bind(this));
      }
    }.bind(this));
  }

  pause() {
    this._isPause = true;
  }
}
AnimeLoop.fixedDeltaTime = 20; // fixed delta time in milli sec
/**
 * return current time in millisecond
 */
AnimeLoop.now = window.performance.now ?
  () => (performance.now() + performance.timing.navigationStart) :
  () => Date.now();

export default AnimeLoop;