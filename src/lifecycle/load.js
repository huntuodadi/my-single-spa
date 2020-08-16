import {
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
} from '../applications/app.helpers';

function flattenFnArray(fns) {
  fns = Array.isArray(fns) ? fns : [fns];
  // 通过promise链式调用  多个方法组合成一个方法
  return (props) => fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
}

export async function toLoadPromise(app) {
  if(app.loadPromise) {
    return app.loadPromise; // 缓存机制
  }
  return (app.loadPromise = Promise.resolve().then(async () => {
    app.status = LOADING_SOURCE_CODE;
    let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
    app.status = NOT_BOOTSTRAPPED; // 还没调用boostrap方法
  
    // bootstrap可以是个数组 希望多个promise组合在一起
    app.bootstrap = flattenFnArray(bootstrap);
    app.mount = flattenFnArray(mount);
    app.unmount = flattenFnArray(unmount);
    delete app.loadPromise;
    return app;
  }));
}