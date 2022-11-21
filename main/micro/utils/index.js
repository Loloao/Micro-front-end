import { getList } from "../constant/subApps"
import {WINDOW_CONST} from '../constant/windowConst'

// 给当前路由跳转打补丁
export const patchRouter = (globalEvent, eventName) => {
  return function() {
    const e = new Event(eventName)
    globalEvent.apply(this, arguments)
    window.dispatchEvent(e)
  }
}

export const currentApp = () => {
  const currentUrl = window.location.pathname
  return filterApp('activeRule', currentUrl)
}

export const findAppByRoute = (router) => {
  return filterApp('activeRule', router)
}

const filterApp = (key, value) => {
  const currentApp = getList().filter(v => v[key] === value)
  return currentApp && currentApp.length ? currentApp[0] : {}
}

// 子应用是否做了替换
export const isTurnChild = () => {
  // 记录上一个子应用
  window[WINDOW_CONST.ORIGIN_APP] = window[WINDOW_CONST.CURRENT_SUB_APP]
  if (window[WINDOW_CONST.CURRENT_SUB_APP] === window.location.pathname) {
    return false
  }
  window[WINDOW_CONST.CURRENT_SUB_APP] = window.location.pathname
  return true
}