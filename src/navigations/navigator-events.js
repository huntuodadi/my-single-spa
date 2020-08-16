import { reroute } from "./reroute";

// hashchange, history api
export const routingEventsListeningTo = ['hashchange', 'popstate'];

function urlReroute(e) {
  console.log('hash change');
  reroute([], arguments); // 会根据路径重新加载不同的应用
}

const captureEventListeners = { //后续挂载的事件先暂存起来
  hashchange: [],
  popstate: [],
}

// 处理应用加载的逻辑是在最前面
window.addEventListener('hashchange', urlReroute)
window.addEventListener('popstate', urlReroute);

const originalAddEventListener = window.addEventListener;
const origianlRemoveEventListener = window.removeEventListener;

window.addEventListener = function(eventName, fn) {
  if(routingEventsListeningTo.includes(eventName) && !captureEventListeners[eventName].some(lis => lis === fn)) {
    captureEventListeners[eventName].push(fn);
    console.log('captureEventListeners:', captureEventListeners);
    return;
  }

  return originalAddEventListener.apply(this, arguments);
}

window.removeEventListener = function(eventName, fn) {
  if(routingEventsListeningTo.includes(eventName)) {
    captureEventListeners[eventName] = captureEventListeners[eventName].filter(l => l !== fn);
    return;
  }
  return originalRemoveEventListener.apply(this, arguments);
}


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
window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');
// 用户可能还会绑定自己的路由事件

// 当我们应用切换后 还需要处理原来的方法， 需要在应用切换后再执行