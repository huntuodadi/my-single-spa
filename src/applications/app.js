import {
  NOT_LOADED,
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
  BOOTSTRAPPING,
  BOOTSTRAPPED,
  NOT_MOUNTED,
  MOUNTING,
  MOUNTED,
  UPDATING,
  UNMOUNTING,
  UNLOADING,
  LOAD_ERR,
  SKIP_BECAUSE_BROKEN,
  shouldBeActive,
} from './app.helpers';
import { reroute } from '../navigations/reroute';

/**
 * 
 * @param {*} appName applicaiton name
 * @param {*} loadApp 
 * @param {*} activeWhen 
 * @param {*} customProps 
 */
const apps = [];

// 维护应用所有的状态 状态机
export function registerApplication(appName, loadApp, activeWhen, customProps) {
  apps.push({
    name: appName,
    loadApp,
    activeWhen,
    customProps,
    status: NOT_LOADED,
  });
  reroute(); //加载应用
}

export function getAppChanges() {
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
      default:
        break;
    }
  });
  return {
    appsToUnmount,
    appsToLoad,
    appsToMount,
  };
}