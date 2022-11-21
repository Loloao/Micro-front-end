import {setList, getList} from './constant/subApps'
import {rewriteRouter} from './router/rewriteRouter'
import {currentApp} from '../micro/utils'
import {setMainLifecycle} from './constant/mainLifeCycle'
import {WINDOW_CONST} from './constant/windowConst'

// 实现路由拦截
rewriteRouter()

export const registerMicroApps = (appList, lifeCycle) => {
  setList(appList)

  setMainLifecycle(lifeCycle)
}

// 启动微前端框架
export const start = () => {
  // 验证子应用列表是否为空
  const apps = getList()

  if (!apps.length) {
    throw Error('子应用列表为空，请正确注册')
  }

  // 有子应用的内容，查找到符合当前路由的子应用内容
  const app = currentApp()

  if (app) {
    const {pathname, hash} = window.location

    const url = pathname + hash
    window.history.pushState('', '', url)
  }

  // 防止触发多次路由拦截
  window[WINDOW_CONST.CURRENT_SUB_APP] = app.activeRule
}