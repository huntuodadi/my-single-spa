import { started } from '../start';
import { getAppChanges } from '../applications/app';
import { toLoadPromise } from '../lifecycle/load';
import { toBootstrapPromise } from '../lifecycle/bootstrap';
import { toMountPromise } from '../lifecycle/mount';
import { toUnmountPromise  } from '../lifecycle/unmount';
import './navigator-events';

// 核心应用处理方法
export function reroute() {

  // 获取需要加载的应用
  // 获取要被挂载的应用
  // 哪些app需要被卸载
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();

  // start 方法的调用时同步的 但是加载流程时异步的
  if(started) {
    // app装载
    return performAppChange(); //根据路径装载应用
  }else{
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