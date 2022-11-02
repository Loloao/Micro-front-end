import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

let instance = null

const render = () => {
  instance = new Vue({
    router: router,
    render: h => h(App),
  }).$mount('#app')
}

// 在微前端环境下才进行加载
if (!window.__MICRO_WEB__) {
  render()
}

// 开始加载结构
export const bootstrap = () => {
  console.log('开始加载')
}


export const mount = () => {
  console.log('渲染成功', instance)
}

export const unmount = () => {
  console.log('卸载')
}