// 应用的状态
export const NOT_LOADED = 'NOT_LOADED';
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED';
export const BOOTSTRAPPING = 'BOOTSTRAPPING';
export const BOOTSTRAPPED = 'BOOTSTRAPPED';
export const NOT_MOUNTED = 'NOT_MOUNTED';
export const MOUNTING = 'MOUNTING';
export const MOUNTED = 'MOUNTED';
export const UPDATING = 'UPDATING';
export const UNMOUNTING = 'UNMOUNTING'; // 解除挂载
export const UNLOADING = 'UNLOADING'; //完全卸载中
export const LOAD_ERR = 'LOAD_ERR';
export const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN';


// 当前应用是否被激活
export function isActive(app) {
  return app.status === MOUNTED;
}

// 当前应用是否要被激活, 如果返回true应用开始初始化等一系列操作
export function shouldBeActive(app) {
  return app.activeWhen(window.location)
}