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

        let minX = + Infinity;
        let minY = + Infinity;
        let minZ = + Infinity;
        let maxX = - Infinity;
        let maxY = - Infinity;
        let maxZ = - Infinity;

        const { vert, norm, index } = info;
        for (let i = 0; i < vert.length; i += 3) {
          const [x, y, z] = [vert[i], vert[i + 1], vert[i + 2]];
          model.positions.push([x, y, z]);

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (z < minZ) minZ = z;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (z > maxZ) maxZ = z;
        }

        model.min = [minX, minY, minZ];
        model.max = [maxX, maxY, maxZ];

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