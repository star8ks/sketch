/**
  Assets manager
  adapted from https://github.com/hookerz/three-assets/blob/master/src/index.js
 */
const debug = console.log.bind(console);
const identity = function() {};

function Assets() {
  const obj = {};

  // A map of three.js loader classes to loader instances. It seems like we
  // only need one instance of each implementation so we just cache them.
  const loaders = {};

  // A map from asset keys to asset URLs. This lets us use multiple keys
  // per URL, if different developers happen to request the same asset with
  // different keys.
  const keyToURL = {};

  // A map from URLs to request promises. This lets us prevent duplicate
  // requests to the same asset URL.
  const requests = {};

  // A map from URLs to loaded and parsed assets. In contrast to the request
  // map, this only gets populated after requests are fulfilled and is only
  // intended for synchronous access.
  const assets = {};

  /**
   * Load an asset.
   * @param key -
   */
  obj.load = function({key, url, loader}) {

    if (arguments.length === 1 && Array.isArray(arguments[0])) {
      const manifest = arguments[0];
      debug(`loading ${ manifest.length } assets`);
      return Promise.all(manifest.map(item => obj.load(item)));
    } else if (arguments.length === 2) {
      // The asset key is optional
      key = null;
      url = arguments[0];
      loader = arguments[1];
    }

    if (url === undefined) {
      throw new Error(`three-assets needs a URL to load the asset`);
    }

    if (loader === undefined) {
      throw new Error(`three-assets needs a three.js loader class to load and parse the asset at <${ url }>`);
    }

    const loaderInstance = loaders[loader] = (loaders[loader] || new loader());

    if (key && keyToURL[key]) {
      debug(`duplicate key "${ key }"`);
      keyToURL[key] = url;
    } else if (key) {
      keyToURL[key] = url;
    }

    // Reuse a pending or previous request to the same URL.
    requests[url] = requests[url] || new Promise(function(resolve, reject) {
      const onLoad = function(asset) {
        debug(`loaded "${ url }"`);
        // Cache the resolved asset for direct access in Assets#get.
        assets[url] = asset;
        resolve(asset);
      };

      const onError = function(err) {
        debug(`error while loading "${ url }" : ${ err.reason || err.message || err }`);
        reject(err);
      };

      loaderInstance.load(url, onLoad, identity, onError);
    });

    return requests[url];
  }

  /**
   * Access an asset.
   */
  obj.get = function(key) {
    const url = keyToURL[key] || key;
    const asset = assets[url];

    if (asset) {
      return asset;
    } else {
      throw new Error(`The asset "${ key }" is not available, either because it was not loaded or it is still pending`);
    }
  }
  return obj;
}

module.exports = Assets;