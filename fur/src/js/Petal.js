class Petal {
  constructor() {
    this.canvas = document.createElement('canvas'); // offscreen canvas
    this.context = this.canvas.getContext('2d');
  }
}

export default Petal;