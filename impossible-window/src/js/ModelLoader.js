const mat4 = require('gl-mat4');
import ObjLoader from './ObjLoader';

class ModelLoader {
  consstructor() {

  }

  static loadObj(url) {
    return fetch(url)
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

        const { vert, norm, index } = info;
        for (let i = 0; i < vert.length; i += 3) {
          model.positions.push([vert[i], vert[i + 1], vert[i + 2]]);
        }
        for (let i = 0; i < norm.length; i += 3) {
          model.normals.push([norm[i], norm[i + 1], norm[i + 2]]);
        }
        for (let i = 0; i < index.length; i += 3) {
          model.cells.push([index[i], index[i + 1], index[i + 2]]);
        }
        return model;
      });
      return models;
    }, e => {
      alert('Model loading failed!');
      console.error(e);
    });
  }
}

export default ModelLoader;