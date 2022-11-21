import {setList} from './constant/subApps'
import {rewriteRouter} from './router/rewriteRouter'

// 实现路由拦截
rewriteRouter()

export const registerMicroApps = appList => {
  setList(appList)
}