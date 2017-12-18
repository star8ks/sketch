import { delegate } from './util';

const UI = {
  onSwitch(switchClass, handler) {
    delegate('click', switchClass, function() {
      handler(this);
    });
  }
};

export default UI;