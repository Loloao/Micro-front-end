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