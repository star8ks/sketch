import { delegate } from './util';

const UI = {
  onSwitch(switchClass, handler) {
    delegate('click', switchClass, function(e) {
      handler(e, this);
    });
  }
};

export default UI;