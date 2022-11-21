import {patchRouter} from '../utils'
import {turnApp} from './routerHandle'
// 重写 window 的路由跳转
export const rewriteRouter = () => {
  window.history.pushState = patchRouter(
    window.history.pushState,
    'micro_push'
  )
  window.history.replaceState = patchRouter(
    window.history.replaceState,
    'micro_replace'
  )

  window.addEventListener('micro_push', turnApp)
  window.addEventListener('micro_replace', turnApp)
  // 在使用浏览器左上角的返回前进时也能被拦截到
  window.onpopstate = function() {
    turnApp()
  }
}