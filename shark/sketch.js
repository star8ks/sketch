let horseModel, numPoints, modelSize, rotationPhase=0, waveVertices, wavePhase=0, animationPosition=0;
 
function preload() {
  horseModel = loadModel('./horse.obj', true);
}
 


function setup() {
  createCanvas(800, 800, WEBGL);
  numPoints = 2000;
  modelSize = 10;//createVector(100, 100);
  
  waveVertices = [];
  for(let i = 0; i < numPoints; i++) {
    waveVertices[i] = createVector(random(-5, 5), 0, random(-5, 5));
  }
}
 
function draw() {
  background(0);
  // base lighting color
  ambientLight(200, 200, 255);

  //translate(0, 50, 0);
  scale(2);
 
  // center model on canvas and corrent rotation
  rotateZ(radians(180));
  //rotate model
  rotateY(rotationPhase);
  model(horseModel);
  //translate(0, -100, 0);
 
 
  for(var i = 0; i < numPoints; i++) {
    var index = floor(map(i, 0, numPoints, 0, horseModel.vertices.length));
    var horseVertex = horseModel.vertices[index];
 
    var waveVertex = waveVertices[i];
    waveVertex.y = sin(waveVertex.x + wavePhase) * cos(waveVertex.z + wavePhase) * 0.4;
 
 
    var vert = createVector(
      map(sin(animationPosition), -1, 1, waveVertex.x, horseVertex.x),
      map(sin(animationPosition), -1, 1, waveVertex.y, horseVertex.y),
      map(sin(animationPosition), -1, 1, waveVertex.z, horseVertex.z)
    );
 
    push();
    translate(vert.x * modelSize, vert.y * modelSize, vert.z * modelSize);
    box(2);
    pop();
  }
  orbitControl();
  rotationPhase = frameCount * 0.05;
  wavePhase = frameCount * 0.02;
  animationPosition = frameCount * 0.05;
 
}