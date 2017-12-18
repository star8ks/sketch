import { noop } from './util';

class ImageLoader {
  static load(url, onLoad=noop, onError=noop) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        onLoad();
        resolve(img);
      };
      img.onerror = e => {
        onError();
        e.message = 'Image load error while loading ' + url;
        reject(e);
      }
    });
  }
}

export default ImageLoader;