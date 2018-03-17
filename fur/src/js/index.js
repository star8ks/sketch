import Pointer from './Pointer';
import {onceLoaded} from './util';
import ImageLoader from './ImageLoader';

onceLoaded(() => {
  let canvas = document.getElementById("board"),
    context = canvas.getContext("2d"),
    width = canvas.width = document.body.clientWidth,
    height = canvas.height = document.body.clientHeight,
    mouseX = width/2, mouseY = height/2;

  const initRSquare = 8000;
  let rSquare = initRSquare;

  const count = width * height / 100;
  let lines = [];
  for(let i = 0; i < count; i++) {
    let x = Math.random() * width,
        y = Math.random() * height
    lines.push({
      x,
      y,
      rotate: getRotate(x - width/2, y - height/2)
    });
  }
  render();

  function render() {
    //context.clearRect(0, 0, width, height);
    // set alpha to 0.4 is the secret for making nice trailing effects
    context.fillStyle = "rgba(255,255,255,.4)";
    context.fillRect(0, 0, width, width);

    for(let line of lines) {
      let x = line.x, y = line.y;
      context.save();
      
      if(distance2(x, y, mouseX, mouseY) < rSquare) {
        draw(line, Math.atan((y - mouseY) / (x - mouseX)));
      } else {
        draw(line);
      }
      
      context.restore();
    }
    
    requestAnimationFrame(render);
  }

  // you can try anything here,
  // such as (x+y)*0.01, (x * y) * 0.00003, Math.sin(x*0.02 + y), Math.sin(x*0.02)
  function getRotate(x, y) {
    return Math.sin(x * 0.02) + 0.01 * y;
  }

  function draw(line, rotate) {
    context.translate(line.x, line.y);
    context.rotate(rotate || line.rotate);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(20, 1);
    context.stroke();
  }

  function distance2(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
  }

  let pointer = new Pointer(canvas);
  pointer.addMoveListener(e => {
    mouseX = pointer.clientX;
    mouseY = pointer.clientY;
  });
  pointer.addPressingListener(e => {
    rSquare += pointer.pressure * 1000;
  });
  pointer.addPressingUpListener(e => {
    rSquare = initRSquare;
  });
});