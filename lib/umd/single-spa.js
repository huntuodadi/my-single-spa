(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

  // 应用的状态
  const NOT_LOADED = 'NOT_LOADED';
  const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
  const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED';
  const BOOTSTRAPPING = 'BOOTSTRAPPING';
  const NOT_MOUNTED = 'NOT_MOUNTED';
  const MOUNTING = 'MOUNTING';
  const MOUNTED = 'MOUNTED';
  const UNMOUNTING = 'UNMOUNTING'; // 解除挂载

  // 当前应用是否要被激活, 如果返回true应用开始初始化等一系列操作
  function shouldBeActive(app) {
    return app.activeWhen(window.location)
  }

  let started = false;
  function start() {
    // 需要挂载应用
    started = true;
    reroute(); //除了加载还需要挂载
  }

  function flattenFnArray(fns) {
    fns = Array.isArray(fns) ? fns : [fns];
    // 通过promise链式调用  多个方法组合成一个方法
    return (props) => fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
  }

  async function toLoadPromise(app) {
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

  async function toBootstrapPromise(app) {
    if(app.status !== NOT_BOOTSTRAPPED) {
      return app;
    }
    app.status = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
  }

  async function toMountPromise(app) {
    if(app.status !== NOT_MOUNTED) {
      return app;
    }
    app.status = MOUNTING;
    await app.mount(app.customProps);
    app.status = MOUNTED;
    return app;
  }

  async function toUnmountPromise(app) {
    if(app.status !== MOUNTED) {
      return app;
    }
    app.status = UNMOUNTING;
    await app.unmount(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
  }

  // hashchange, history api
  const routingEventsListeningTo = ['hashchange', 'popstate'];

  function urlReroute(e) {
    console.log('hash change');
    reroute(); // 会根据路径重新加载不同的应用
  }

  const captureEventListeners = { //后续挂载的事件先暂存起来
    hashchange: [],
    popstate: [],
  };

  // 处理应用加载的逻辑是在最前面
  window.addEventListener('hashchange', urlReroute);
  window.addEventListener('popstate', urlReroute);

  const originalAddEventListener = window.addEventListener;

  window.addEventListener = function(eventName, fn) {
    if(routingEventsListeningTo.includes(eventName) && !captureEventListeners[eventName].some(lis => lis === fn)) {
      captureEventListeners[eventName].push(fn);
      console.log('captureEventListeners:', captureEventListeners);
      return;
    }

    return originalAddEventListener.apply(this, arguments);
  };

  window.removeEventListener = function(eventName, fn) {
    if(routingEventsListeningTo.includes(eventName)) {
      captureEventListeners[eventName] = captureEventListeners[eventName].filter(l => l !== fn);
      return;
    }
    return originalRemoveEventListener.apply(this, arguments);
  };


  // hashrouter
  // browserrouter 时h5api 切换时不会触发popstate
  function patchedUpdateState(updateState, methodName) {
    return function() {
      const urlBefore = window.location.href;
      updateState.apply(this, arguments);
      const urlAfter = window.location.href;
      if(urlBefore !== urlAfter) {
        // 重新加载应用 传入事件源
        urlReroute(new PopStateEvent('popstate'));
      }
    }
  }
  window.history.pushState = patchedUpdateState(window.history.pushState);
  window.history.replaceState = patchedUpdateState(window.history.replaceState);
  // 用户可能还会绑定自己的路由事件

  // 当我们应用切换后 还需要处理原来的方法， 需要在应用切换后再执行

  // 核心应用处理方法
  function reroute() {

    // 获取需要加载的应用
    // 获取要被挂载的应用
    // 哪些app需要被卸载
    const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();

    // start 方法的调用时同步的 但是加载流程时异步的
    if(started) {
      // app装载
      return performAppChange(); //根据路径装载应用
    }else {
      // 注册时 需要预先加载
      return loadApps();
    }

    async function loadApps() {
      let apps = await Promise.all(appsToLoad.map(toLoadPromise)); //  获取到bootstrap mount unmount方法放到app上
    }

    async function performAppChange() {
      // 先卸载不需要的应用
      let unmountPromises = await Promise.all(appsToUnmount.map(toUnmountPromise));
      // 去加载需要的应用
      appsToLoad.map(async (app) => { // 将需要加载的应用拿到 => 加载 => 启动 => 挂载. 问题: 这里为什么还要再加载一遍
        return await toMountPromise(await toBootstrapPromise(await toLoadPromise(app)));
      });
      appsToMount.map(async app => {
        return await toMountPromise(await toBootstrapPromise(app))
      });
    }
  }

  // 这个流程适用于初始化操作的，还需要当路径切换时重新加载
  // 重写路由相关方法(路由拦截)

  /**
   * 
   * @param {*} appName applicaiton name
   * @param {*} loadApp 
   * @param {*} activeWhen 
   * @param {*} customProps 
   */
  const apps = [];

  // 维护应用所有的状态 状态机
  function registerApplication(appName, loadApp, activeWhen, customProps) {
    apps.push({
      name: appName,
      loadApp,
      activeWhen,
      customProps,
      status: NOT_LOADED,
    });
    reroute(); //加载应用
  }

  function getAppChanges() {
    const appsToUnmount = [];
    const appsToLoad = [];
    const appsToMount = [];
    apps.forEach(app => {
      // 需不需要被加载
      const appShouldBeActive = shouldBeActive(app);
      switch(app.status) {
        case NOT_LOADED:
          
        case LOADING_SOURCE_CODE:
          if(appShouldBeActive) {
            appsToLoad.push(app);
          }
          break;

        case NOT_BOOTSTRAPPED:
        case BOOTSTRAPPING:
        case NOT_MOUNTED:
          if(appShouldBeActive) {
            appsToMount.push(app);
          }
          break;
        case MOUNTED:
          if(!appShouldBeActive) {
            appsToUnmount.push(app);
          }
      }
    });
    return {
      appsToUnmount,
      appsToLoad,
      appsToMount,
    };
  }

  exports.registerApplication = registerApplication;
  exports.start = start;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map
