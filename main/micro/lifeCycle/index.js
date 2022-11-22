import {findAppByRoute} from '../utils'
import {WINDOW_CONST} from '../constant/windowConst'
import {getMainLifecycle} from '../constant/mainLifeCycle'
import {loadHtml} from '../loader'

export const lifecycle = async () => {
  const lastApp = window[WINDOW_CONST.ORIGIN_APP]
  const currentApp = window[WINDOW_CONST.CURRENT_SUB_APP]
  // 获取到上一个子应用
  const prevApp = findAppByRoute(lastApp)

  // 获取到要跳转到的子应用
  const nextApp = findAppByRoute(currentApp)
  console.log(prevApp, nextApp)

  if (!nextApp) return

  if (prevApp && prevApp.unmount) {
    if (prevApp.proxy) {
      prevApp.proxy.inactive()
    }
    await destroyed(prevApp)
  }
  // 这一步返回真实的 app 内容
  const app = await beforeLoad(nextApp)  

  mounted(app)
}
export const beforeLoad = async (app) => {
  await runMainLifeCycle('beforeLoad')
  app && app.beforeLoad && app.beforeLoad()

  // 获取子应用内容
  const subApp = await loadHtml(app)
  subApp && subApp.beforeLoad && subApp.beforeLoad()

  return subApp
}

export const mounted = async (app) => {
  app && app.mount && app.mount()

  await runMainLifeCycle('mounted')
}

export const destroyed = async (app) => {
  app && app.unmount && app.unmount()
  // 对应的执行主应用生命周期
  await runMainLifeCycle('destroyed')
}

export const runMainLifeCycle = async (type) => {
  const mainLife = getMainLifecycle()
  await Promise.all(mainLife[type].map(async item => await item()))
}