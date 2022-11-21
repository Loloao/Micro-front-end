# Micro-front-end

本工程用于学习微前端底层原理

## 构建子工程

`build/run.js`以一个脚本启动全部子工程

### 后端应用
通过 koa-generator 构建一个 koa 后端应用接收请求
使用 supervisor 自动重启应用
使用 koa2-cors 解决跨域问题

## 子应用接入微前端

首先需要主应用获取子应用的生命周期，包括一些方法，这样就可以在主应用里控制子应用的加载和卸载。同时还得获取子应用的结构，包括它所依赖的文件。所以需要对子应用做改造再介入到微前端里

### vue2

- 将子应用打包成 umd 格式，并将 webpack 里的 library 设置为 vue2，这样就能通过 window.vue2 获取到子应用里的生命周期
- 设置跨域

```javascript
headers: {
  'Access-Control-Allow-Origin': '*'
}
```

- 使用一个函数将 main.js 里的根节点挂载函数包裹住，这样就能根据微前端生命周期触发 render 函数从而挂载子应用。之后定义生命周期

```javascript
const render = () => {
  new Vue({
    router: router,
    render: h => h(App),
  }).$mount('#app')
}

// 开始加载结构
export const bootstrap = () => { 
  console.log('开始加载')
}


export const mount = () => {
  render()
  console.log('渲染成功')
}

export const unmount = () => {
  console.log('卸载')
}
```

## 中央控制器 - 主应用
负责所有子应用卸载更新和加载，是链接子应用和微前端的工具，公共依赖都是放在主应用里，对外提供修改的方法

提供进入子应用的路由

### 注册子应用

**定义主应用路由**

```js
{
    path: '/vue2',
    component: () => import('../App.vue')
},
{
    path: '/vue3',
    component: () => import('../App.vue')
},
{
    path: '/react16',
    component: () => import('../App.vue')
},
```

**定义子应用路由激活状态**

```js
// store/sub.js
export const subNavList = [
  {
    name: 'vue2',
    // 激活规则
    activeRule: '/vue2',
    // 挂载节点
    container: '#micro-container',
    // 入口
    entry: '//localhost:8002'
  },
  {
    name: 'vue3',
    activeRule: '/vue3',
    container: '#micro-container',
    entry: '//localhost:8003'
  },
  {
    name: 'react16',
    activeRule: '/react16',
    container: '#micro-container',
    entry: '//localhost:8001'
  },
]
```

**在 app.vue 定义子应用挂载内容**
加上 id，方便挂载子应用
`<div id='micro-container'>子应用内容</div>`
直接注册子应用列表
```js
// app.js，实际就是将上面的 subNavList 保存到全局
import { registerApp } from './utils';
registerApp(subNavList)
```

**路由拦截**
其实就是在使用 pushState 和 replaceState 的时候额外触发一个事件，实现路由监控，路由拦截
```js
// 给当前路由跳转打补丁
export const patchRouter = (globalEvent, eventName) => {
  return function() {
    const e = new Event(eventName)
    globalEvent.apply(this, arguments)
    window.dispatchEvent(e)
  }
}

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
```

### 获取首个子应用
