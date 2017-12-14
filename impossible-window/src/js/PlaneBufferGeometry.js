// PlaneBufferGeometry from three.js
function PlaneBufferGeometry({width=1, height=1, widthSegments=1, heightSegments=1} = {}) {
  this.type = 'PlaneBufferGeometry';

  this.parameters = {
    width: width,
    height: height,
    widthSegments: widthSegments,
    heightSegments: heightSegments
  };

  var width_half = width / 2;
  var height_half = height / 2;

  var gridX = Math.floor(widthSegments) || 1;
  var gridY = Math.floor(heightSegments) || 1;

  var gridX1 = gridX + 1;
  var gridY1 = gridY + 1;

  var segment_width = width / gridX;
  var segment_height = height / gridY;

  var ix, iy;

  // buffers

  this.indices = [];
  this.vertices = [];
  this.normals = [];
  this.uvs = [];

  // generate vertices, normals and uvs

  for (iy = 0; iy < gridY1; iy++) {

    var y = iy * segment_height - height_half;

    for (ix = 0; ix < gridX1; ix++) {

      var x = ix * segment_width - width_half;

      this.vertices.push([x, - y, 0]);

      this.normals.push([0, 0, 1]);

      this.uvs.push([ix / gridX, 1 - (iy / gridY)]);

    }

  }

  // indices

  for (iy = 0; iy < gridY; iy++) {

    for (ix = 0; ix < gridX; ix++) {

      var a = ix + gridX1 * iy;
      var b = ix + gridX1 * (iy + 1);
      var c = (ix + 1) + gridX1 * (iy + 1);
      var d = (ix + 1) + gridX1 * iy;

      // faces

      this.indices.push([a, b, d]);
      this.indices.push([b, c, d]);

    }

  }

  // build geometry

  // console.log(this.vertices, this.normals, this.indices);

}

export default PlaneBufferGeometry;