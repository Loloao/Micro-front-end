import {performScriptForEval} from './performScript'
import {WINDOW_CONST} from '../constant/windowConst'
// import {SnapShotSandbox} from './snapShotSandbox'
import {ProxySandbox} from './proxySandbox'

// 子应用生命周期处理， 环境变量设置
export const sandBox = (app, script) => {
  const proxy = new ProxySandbox()
  if (!app.proxy) {
    app.proxy = proxy
  }
  // 1. 设置环境变量
  window[WINDOW_CONST.MICRO_WEB] = true
  // 2. 运行js文件
  // 不仅仅执行了子应用脚本，执行完成之后也获取到子应用生命周期
  const lifecycle = performScriptForEval(script, app.name, app.proxy.proxy)
  // 运行完js后需要得到生命周期内容，将所有的生命周期函数挂载到app上，挂载完成后就可以在微前端框架lifeCycle里获取到app的生命周期内容并执行
  if (isCheckLifeCycle(lifecycle)) {
    app.bootstrap = lifecycle.bootstrap
    app.mount = lifecycle.mount
    app.unmount = lifecycle.unmount
  }
}
const isCheckLifeCycle = lifecycle => lifecycle &&
  lifecycle.bootstrap &&
  lifecycle.mount &&
  lifecycle.unmount

// main > micro > sandbox > performScript.js