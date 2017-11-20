// Calling the regl module with no arguments creates a full screen canvas and
// WebGL context, and then uses this context to initialize a new REGL instance
const regl = require('regl')();
const mat4 = require('gl-mat4');
import Pointer from './Pointer';
import Mesh from './Mesh';
import ObjLoader from './ObjLoader';
import Anime from './Anime';


const DEV = false;
const pointer = new Pointer(regl._gl.canvas);


fetch('oscar.obj')
.then(response => response.text())
.then(text => {
  // const objs = text.replace(/\n+^$\n/mg, '\n') // remove empty lines
  //   .concat('\n') // add tail new line to make match below esier
  //   .match(/^o(.|\n)*?(?=(^o|\n^$))/mg);

  const infos = ObjLoader.parseObjText(text);

  let models = infos.map(info => {
    const model = {
      positions: [],
      normals: [],
      cells: [],
      matrix: mat4.identity([]),
      name: info.name
    };

    const {vert, norm, index} = info;
    for(let i=0; i<vert.length; i+=3) {
      model.positions.push([vert[i], vert[i+1], vert[i+2]]);
    }
    for(let i=0; i<norm.length; i+=3) {
      model.normals.push([norm[i], norm[i+1], norm[i+2]]);
    }
    for(let i=0; i<index.length; i+=3) {
      model.cells.push([index[i], index[i+1], index[i+2]]);
    }
    return model;
  });
  return models;
}, e => {
  alert('Model loading failed!');
  console.error(e);
})
.then(models => {
  const meshes = models.map(model => new Mesh(regl, model));
  // console.log(meshes);
  const cubeMesh = meshes[meshes.findIndex(mesh => mesh.name === 'cube')];
  console.log(cubeMesh);

  // find all vertex on cube bottom plane
  // if normal.y is -1, the vertex is on bottom face
  const bottomIndex = cubeMesh.normals
      .findIndex(normal => Math.abs(normal[1] + 1) < 0.01);
  const bottomVert = cubeMesh.positions[bottomIndex];
  const bottomVerts = [];
  cubeMesh.positions.forEach((position, index) => {
    if (Math.abs(position[1] - bottomVert[1]) < 0.01) {
      bottomVerts.push(position);
    }
  });

  const anime = new Anime(dt => {
    // If you are not using regl.frame() to tick your application,
    // then you should periodically call regl.poll() each frame
    // to update the timer statistics.
    regl.poll();

    regl.clear({
      depth: 1,
      color: [1, 1, 1, 1]
    });
    for(let mesh of meshes) {
      mesh.draw({
        gameEnd: true
      });
    }

    const magicY = -2.46;
    bottomVerts.forEach(vert => {
      vert[1] -= dt * 0.002;
      if(vert[1] < magicY) {
        vert[1] = magicY;
      }
    });

    // if(anime.frameCount > 200) anime.pause();
  });

});
