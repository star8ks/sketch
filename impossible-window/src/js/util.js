function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function transformPoint(matrix4, vector3) {

}

function delegate(events, className, handler) {
  if (Array.isArray(events)) {
    events.forEach(event => addListener(event))
  } else {
    addListener(events);
  }
  function addListener(event) {
    document.addEventListener(event, function (e) {
      for (let target = e.target; target && target != this; target = target.parentNode) {
        if (target.classList.contains(className)) {
          handler.call(target, e);
          break;
        }
      }
    }, false);
  }
}
function delegateOnce(events, className, handler) {
  if (Array.isArray(events)) {
    events.forEach(event => addListener(event))
  } else {
    addListener(events);
  }

  function addListener(event) {
    const exclude = new Set(); // save targets that event have been triggered on
    document.addEventListener(event, function _handler(e) {
      for (let target = e.target; target && target != this; target = target.parentNode) {
        if (target.classList.contains(className) && !exclude.has(target)) {
          handler.call(target, e);
          exclude.add(target);

          // when all targets' event triggered, remove _handler on document
          // but targetsLength may vary, so don't remove _handler. Do you have a solution?
          // if(exclude.size === targetsLength) document.removeEventListener(event, _handler);
          break;
        }
      }
    }, false);
  }
}

function bind(selector, events, handler) {
  const target = selector instanceof EventTarget
      ? selector : document.querySelector(selector);

  if (Array.isArray(events)) {
    events.forEach(event => target.addEventListener(event, handler, false));
  } else {
    target.addEventListener(events, handler, false);
  }
}
function unbind(selector, events, handler) {
  const target = selector instanceof EventTarget
    ? selector : document.querySelector(selector);

  if (Array.isArray(events)) {
    events.forEach(event => target.removeEventListener(event, handler));
  } else {
    target.removeEventListener(events, handler);
  }
}

function bindOnce(selector, event, handler) {
  bind(selector, event, function _handler(e) {
    handler(e);
    unbind(selector, event, _handler);
  });
}

const util = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  clamp,
  bind, bindOnce, delegate, delegateOnce
};

export default util;
export {
  clamp,
  bind, bindOnce, delegate, delegateOnce
}