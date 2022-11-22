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
根据跳转的 pathname 从子应用列表中去除对应子应用信息
```js
export const currentApp = () => {
  const currentUrl = window.location.pathname
  return filterApp('activeRule', currentUrl)
}

const filterApp = (key, value) => {
  const currentApp = getList().filter(v => v[key] === value)
  return currentApp && currentApp.length ? currentApp[0] : {}
}
```

由于是首个子应用，所以加载后直接跳转到子应用
```js
// 有子应用的内容，查找到符合当前路由的子应用内容
const app = currentApp()

if (app) {
  const {pathname, hash} = window.location

  const url = pathname + hash
  window.history.pushState('', '',url)
}

// 防止触发多次路由拦截
window.__CURRENT_SUB_APP__ = app.activeRule
```

### 主应用生命周期

就是注册了一个包含了生命周期数组的对象，存放在全局里
```js
// /src/utils
export const registerApp = (list) => {
  // 注册到微前端框架中
  registerMicroApps(list, {
    beforeLoad: [
      () => {console.log('开始加载')}
    ],
    mounted: [
      () => {console.log('渲染完成')}
    ],
    destroyed: [
      () => {console.log('卸载完成')}
    ]
  })

  start()
}

// mainLifeCycle.js
let lifecycle = {}
export const getMainLifecycle = () => lifecycle

export const setMainLifecycle = mainLifecycle => lifecycle = mainLifecycle
```

添加主应用和子应用生命周期，主要是通过之前的路由拦截，在跳转路由之前调用上一个应用的 destroyed，在跳转之后调用下一个应用的 beforeload，同时调用主应用对应的方法

```js
import {findAppByRoute} from '../utils'
import {WINDOW_CONST} from '../constant/windowConst'
import {getMainLifecycle} from '../constant/mainLifeCycle'

export const lifecycle = async () => {
  const lastApp = window[WINDOW_CONST.ORIGIN_APP]
  const currentApp = window[WINDOW_CONST.CURRENT_SUB_APP]
  // 获取到上一个子应用
  const prevApp = findAppByRoute(lastApp)

  // 获取到要跳转到的子应用
  const nextApp = findAppByRoute(currentApp)

  if (!nextApp) return

  if (prevApp) {
    await destroyed(prevApp)
  }
  // 这一步返回真实的 app 内容
  const app = await beforeLoad(nextApp)  

  mounted(app)
}
export const beforeLoad = async (app) => {
  await runMainLifeCycle('beforeLoad')
  app && app.beforeLoad && app.beforeLoad()

  const newApp = null
  return newApp
}

export const mounted = async (app) => {
  app && app.mounted && app.mounted()

  await runMainLifeCycle('mounted')
}

export const destroyed = async (app) => {
  app && app.destroyed && app.destroyed()
  // 对应的执行主应用生命周期
  await runMainLifeCycle('destroyed')
}

export const runMainLifeCycle = async (type) => {
  const mainLife = getMainLifecycle()
  await Promise.all(mainLife[type].map(async item => await item()))
}
```

### 获取需要展示的页面，加载和解析 html

**获取子应用**
启动子应用后，直接发送请求获取子应用的 html 文件，之后挂载到主应用的子应用 DOM 节点

```js
import { fetchResource } from "../utils/fetchResource"
// 加载 html 的方法
export const loadHtml = async (app) => {
  // 第一，子应用需要显示在哪里
  let container = app.container
  // 子应用入口
  let entry = app.entry

  const html = await parseHtml(entry)

  const ct = document.querySelector(container)
  ct.innerHTML = html

  return app
}

```

**解析 HTML**

解析 html 文件中的 link 和 script 标签获取脚本，并将脚本拼接起来

```js
export const parseHtml = async (entry) => {
  const html = await fetchResource(entry)
  console.log(html, 'html')

  // 创建一个 div 当做
  const div = document.createElement('div')
  div.innerHTML = html

  // 标签、link、script
  const [dom, scriptUrl, script] = await getResources(dir)

  const fetchedScript = await Promise.all(scriptUrl.map(async item => fetchResource(item)))

  allScript = script.concat(fetchedScript)
  
  return html
}

export const getResources = async (root, entry) => {
  const scriptUrl = []
  const script = []
  // outerHTML 相当于包含当前节点的 innerHTML
  const dom = root.outerHTML

  // 深度解析
  function deepParse(element) {
    const children = element.children
    const parent = element.parent
    
    // 处理 script 标签
    if (element.nodeName.toLowerCase() === 'script') {
      const src = element.getAttribute('src')
      if (!src) {
        script.push(element.outerHTML)
      } else {
        // 这里的处理就是判断是否为绝对路径或是相对路径
        // 如果是相对路径，就需要加上 entry
        if (src.startsWith('http')) {
          scriptUrl.push(src)
        } else {
          scriptUrl.puth(`http:${entry}/${src}`)
        }
      }

      if (parent) {
        parent.replaceChild(document.createComment('此 js 内容已被微前端替换'), element)
      }
    }
    // 处理 link 标签，也会有 js 内容
    if (element.nodeName.toLowerCase() === 'link') {
      const href = element.getAttribute('href')

      if (href.endsWith('.js')) {
        if (href.startsWith('http')) {
          scriptUrl.push(href)
        } else {
          scriptUrl.puth(`http:${entry}/${href}`)
        }
      }
    }

    for(let i = 0; i < children.length; i++) {
      deepParse(children[i])
    }
  }
  deepParse(root)
  
  return [dom, scriptUrl, script]
}
```

### 加载 js
在获取脚本后直接运行脚本并将获取的结果绑定在 window 上，同时把子应用的生命周期绑定在主应用中设定的子应用对象上

```js
// main > micro > loader > index.js
import { sandBox } from "../sandbox";
// 加载html的方法
export const loadHtml = async (app) => {

  // ...

  // 直接运行
  scripts.forEach(item => {
    sandBox(app, item)
  })

  return app
}



// main > micro > sandbox > index.js
// 子应用生命周期处理， 环境变量设置
export const sandBox = (app, script) => {
  // 1. 设置环境变量
  window.__MICRO_WEB__ = true
  // 2. 运行js文件
  // 不仅仅执行了子应用脚本，执行完成之后也获取到子应用生命周期
  const lifecycle = performScriptForEval(script, app.name)
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
export const performScriptForEval = (script, appName) => {
  // 之前配置的library可以获取window.appName有生命周期函数
  const scriptText = `
    () => {
      ${script}
      return window['${appName}'] 
    }
  `
  return eval(scriptText).call(window,window)// app module mount
}
export const performScriptForFunction = (script, appName) => {
  const scriptText = `
      ${script}
      return window['${appName}']
  `
  return new Function(scriptText).call(window,window)
}
```

### 运行环境隔离

> 为什么要隔离运行环境?
如在vue3>main.js的mount中设置window.a=1;在加载应用时，切换到其他子应用window.a还存在，这样对公共的变量没问题，但是如果变量只在某个子应用里应用，切换到其他应用变量还存在对逻辑获取、变量设置都会有影响。

所以我们需要将运行时变量维护在子应用里，切换子应用变量消失掉；如果有子应用公共的变量，可以放在主应用里，或者通过主应用的方法设置到全局上

有两种方式实现沙箱隔离

**快照沙箱**
运行时变量维护在子应用里，子应用公共变量放在主应用里，或者可以通过主应用方法设在全局里

将子应用运行在沙箱环境中，可以设置一个沙箱环境在运行整体js时就需要将沙箱环境给设置上

创建一个文件snapShotSandbox快照沙箱，针对给当前全局变量实现一个快照的方式，来记录我们沙箱的内容，在子应用切换之后，将所有沙箱的变量置为初始值

在生命周期上一个子应用销毁前将沙箱环境重置

消耗和执行性能都是比较差的，一个window上会挂很多属性，

```js
// main > micro > sandbox > snapShotSandbox.js
// 快照沙箱：针对于给当前的全局变量实现一个快照的方式来记录我们沙箱的内容，在子应用切换后将所有沙箱的变量设为初始值
// 消耗和执行性能都是比较差的，一个window上会挂很多属性，
// 应用场景：比较老版本的浏览器，
export class SnapShotSandbox {
  constructor() {
    // 1. 代理对象
    this.proxy = window // 之后就可以使用proxy这个代理对象完成全局对象的替换

    this.active()
  }
  // 沙箱激活
  active() {
    // 创建一个沙箱快照
    this.snapshot = new Map()

    // 遍历全局环境
    for(const key in window) {
      this.snapshot[key] = window[key] // 将window所有的key值记录在快照对象上
    }
  }
  // 沙箱销毁
  inactive () {
    for (const key in window) {
      if (window[key] !== this.snapshot[key]) {
        // 还原操作
        window[key] = this.snapshot[key]
      }
    }
  }
}
```

**代理沙箱**

快照沙箱是不支持多实例的，同一时间我们的页面只可以显示一个子应用，如果一个页面需要显示多个子应用快照沙箱不支持，要用代理沙箱。

```js
// 快照沙箱是不支持多实例的，同一时间我们的页面只可以显示一个子应用，
// 如果一个页面需要显示多个子应用快照沙箱不支持，要用代理沙箱
// 对于Proxy可以查下具体文档的使用，可以将它代理的对象做个拦截，
// 我们之后对代理的对象做任何操作都在它拦截上处理一次,举个例子,Proxy可以做到13种拦截
// main > micro > sandbox > proxySandbox.js
let defaultValue = {} // 子应用的沙箱容器
export class ProxySandbox{
  constructor() {
    this.proxy = null;

    this.active()
  }
  // 沙箱激活
  active() {
    // 子应用需要设置属性，
    this.proxy = new Proxy(window, {
      get(target, key) {
        // 处理Illegal invocation非法操作
        if (typeof target[key] === 'function') {
          return target[key].bind(target)
        }
        // 做兼容操作，如果defaultValue找不到去target上找，比如location
        return defaultValue[key] || target[key] 
      },
      set(target, key, value) {
        defaultValue[key] = value
        return true
      }
    })

  }

  // 沙箱销毁
  inactive () {
    defaultValue = {}
  }
}

// main > micro > sandbox > performScript.js
// 执行js脚本
export const performScriptForFunction = (script, appName, global) => {
  window.proxy = global
  console.log(global)
  const scriptText = `
    return ((window) => {
      ${script}
      return window['${appName}']
    })(window.proxy)
  `
  return new Function(scriptText)()
}
export const performScriptForEval = (script, appName, global) => {
  // library window.appName
  window.proxy = global
  const scriptText = `
    ((window) => {
      ${script}
      return window['${appName}'] 
    })(window.proxy)
  `
  return eval(scriptText)// app module mount
}
```

**css 样式隔离**
1. css modules
  在子应用里配置css-loader设置module为true
2. shadow dom
  通过mode-attachShadow方法，这是比较新的语法，对浏览器兼容性支持性不是很高，将我们的元素、样式统一隔离到虚拟的dom上，这个dom集中我们所有的内容，和其他内容没有任何冲突的
3. minicss
  单独的 css 文件，通过 link 引用，当切换文件的时候，它的link会被清空
4. css in js
  所有 css 都是通过 js 进行设置的，如果清空 js 其实就相当于清空了 css 样式

## 应用间通信

### 父子通信

比如登录状态父应用改变了，则子应用也需要改变，此时就需要父子进行通信。有两种方法可以进行通信

**props**
通过生命周期函数把主应用的状态和函数传给子应用
```js
import { loading } from '../store'
import * as appInfo from '../store'
export const subNavList = [
  {
    name: 'react15',// 唯一
    entry: '//localhost:9002/',
    loading,
    container: '#micro-container',
    activeRule: '/react15',
    appInfo,
  },
  {
    name: 'react16',
    entry: '//localhost:9003/',
    loading,
    container: '#micro-container',
    activeRule: '/react16',
    appInfo,
  },
  {
    name: 'vue2',
    entry: '//localhost:9004/',
    loading,
    container: '#micro-container',
    activeRule: '/vue2',
    appInfo,
  },
  {
    name: 'vue3',
    entry: '//localhost:9005/',
    loading,
    container: '#micro-container',
    activeRule: '/vue3',
    appInfo,
  },
];
// 微前端框架对于子应用的处理基本集中在main>micro>lifeCycle>index.js里，执行里app所有的生命周期，获取里dom结构，加载里资源，接下来需要在对应生命周期里来将app信息传递给子应用里，在执行子应用app.mount的时候将appInfo传递过去
// main>src>util>index.js的registerApp注册子应用的方法里将store内容传递给子应用
export const mounted = async (app) => {
  app && app.mount && app.mount({
    appInfo: app.appInfo,
    entry: app.entry
  })

  await runMainLifeCycle('mounted')
}



// react16>src>index.js接下来就可以在子应用react16的mounted事件里获取到主应用的内容
export const mount = (app) => {
  app.appInfo.header.changeHeader(false)
  app.appInfo.nav.changeNav(false)
  render()
}

//对于react16而言，只需要在登录页面进行隐藏，目前其他页面也是隐藏的
// react16>src>utils>main.js对app做个缓存
let main = null
export const setMain = (data) => {
  main = data
}
export const getMain = () => {
  return main
}


// react16>src>index.js中将app设置在main对象上
import {setMain} from './src/utils/main';
export const mount = (app) => {
  setMain(app)
  render()
}


//react16>src>pages>login>index.jsx中隐藏,登录页面隐藏，其他页面还是显示
import { getMain } from '../../utils/main'
  useEffect(() => {
    // 不仅仅可以获取到主应用方法，同时也可以通过方法向主应用传递我们的参数
    const main = getMain()
    main.appInfo.header.changeHeader(false)
    main.appInfo.nav.changeNav(false)
  }, [])

// 好莱坞原则 - 不用联系我，当我需要的时候会打电话给你
// 依赖注入 - 主应用的显示隐藏，注入到子应用内部，通过子应用内部的方法进行调用
```
**customEvent**

```js
// 2.customevent
//main>micro>customevent>index.js
export class Custom {
  // 事件监听
  on (name, cb) {
    window.addEventListener(name, (e) => {
      cb(e.detail)
    })
  }
  // 事件触发
  emit(name, data) {
    const event = new CustomEvent(name, {
      detail: data
    })
    window.dispatchEvent(event)
  }
}


//main>micro>start.js
import { Custom } from './customevent'
const custom = new Custom()
custom.on('test', (data) => {
  console.log(data)
})
window.custom = custom

// vue3>src>main.js
export const mount = () => {
  window.custom.emit('test',{
    a:1
  })
  render()
}
//可以看到打印的a:1,子应用向主应用传递事件，同样道理也可以从主应用向子应用发送事件，但是一定要注意监听和触发的时机，监听一定要在触发之前，否则会产生一些监听不到的问题
```

### 子应用间通信

对于微前端而言，需要获取上一个应用的内容，表明当前的应用设计是有一些缺陷的，理论上来说，我们每一个应用之间都不会依赖于上一个或者下一个应用间的信息，这些信息我们都可以通过主应用或者数据服务来获取，但也避免不了一些及其特殊的情况，我们需要用到上一个子应用处理过的信息，在这子应用里做其他处理

同样也是两种方式，props 和 customevent

```js
// 1.props
// 子应用1 - 父应用交互 - 子应用2，子应用1和父应用进行交互，得到子应用1传递的参数，父应用与子应用2进行交互，将子应用1传递的参数通过父应用的转发传递给子应用2
// 2.customevent
// 例如vue3与vue2进行通信
//vue3>src>main.js
export const mount = () => {
  window.custom.on('test1',(data)=>{
    console.log(data)
  })
  render()
}


//vue2>src>main.js触发一个事件将参数传递到vue3里
export const mount = () => {
  window.custom.emit('test1',{
    a:1
  })
  render()
}
// vue3切换到vue2子应用里会打印a:1对象

//如果需要从vue3向vue2发传递数据
//vue2>src>main.js
export const mount = () => {
  window.custom.on('test2',(data)=>{
    console.log(data,'======')
  })
  window.custom.emit('test1',{
    a:1
  })
  render()
}
//vue3>src>main.js
export const mount = () => {
  //先有监听再有触发
  window.custom.on('test1',(data)=>{
      window.custom.emit('test2',{
        b:2
      })
  })
  render()
}
```

### 全局 store
发布订阅模式
**好处**
1. 不使用任何的eventName就可以做到事件监听
2. 同个事件可以添加很多observers，添加狠多订阅者，之后通过订阅者来遍历，修改所有我们的订阅者依赖

- 没有之前所说的命名会重复的问题，但是也要注意添加订阅者和update操作也有先后顺序，只有先添加订阅者在操作之后才可以通知到订阅者，如果没有添加订阅者直接进行update操作可以通知到其他订阅者，但是你当前需要的数据没有了

```js
//上节讲到的监听如果当前监听的方法非常多，会出现监听方法重叠，需要做到name的唯一化管理，极大提升开发难度，所以我们需要一个管理系统，不需要定义我们监听的事件，也可以触发我们所有监听的内容
//main>micro>store>index.js
export const createStore = (initData = {}) => (() => {
  let store = initData
  const observers = [] // 管理所有的订阅者，依赖
  // 获取store
  const getStore = () => store
  // 更新store
  const update = (value) => {
    if (value !== store) {
      // 执行store的操作
      const oldValue = store
      // 将store更新
      store = value
      // 通知所有的订阅者，监听store的变化
      observers.forEach(async item => await item(store, oldValue))
    }
  }
  // 添加订阅者
  const subscribe = (fn) => {
    observers.push(fn)
  }
  return {
    getStore,
    update,
    subscribe,
  }
})()
//在微前端框架里实现这样的状态管理，与所有的框架都是没有关系的，每套框架都可以使用这套状态管理体系来做


//main>src>utils>index.js
import { createStore } from '../../micro'
const store = createStore()
window.store = store
store.subscribe((newValue, oldValue) => {
  console.log(newValue, oldValue, '---')
}) // 添加订阅者


//vue3>src>main.js
export async function mount(app) {
  const storeData = window.store.getStore() // 获取默认的data
  //更新数据，更新完成后会通知订阅者
  window.store.update({
    ...storeData, // store里是完全做替换的，需要将之前所有数据传递过去
    a:11
  })
  render();
}
```

### 提高加载性能 应用缓存

其实就是把子应用的 html 解析后的 dom 节点和 js 脚本缓存起来

```js
// main > micro > loader > index.js里加载过的资源不再进行加载
const cache = {} // 根据子应用的name来做缓存
export const parseHtml = async (entry, name) => {
  // ...
  if (cache[name]) {
    return cache[name]
  }
  // ...
  cache[name] = [dom, allScript] // 
  return [dom, allScript]
}
```

### 预加载子应用

其实就是在家在第一个子应用后，直接发送请求加载其他子应用，但是只是解析 html，并不进行显示

```js
// main>micro>start.js
import { prefetch } from './loader/prefetch'
// 启动微前端框架
export const start = () => {
  // 首先验证当前子应用列表是否为空
  const apps = getList()
  if (!apps.lenth) {
    // 子应用列表为空
    throw Error('子应用列表为空， 请正确注册')
  }
  // 有子应用的内容， 查找到符合当前路由的子应用
  const app = currentApp()
  const { pathname, hash } = window.location

  if (!hash) {
    // 当前没有在使用的子应用
    // 1. 抛出一个错误，请访问正确的连接
    // 2. 访问一个默认的路由，通常为首页或登录页面
    window.history.pushState(null, null, '/vue3#/index')
  }
  if (app && hash) {
    const url = pathname + hash
    window.__CURRENT_SUB_APP__ = app.activeRule
    window.history.pushState('', '', url)
  }
  // 预加载 - 加载接下来的所有子应用，但是不显示
  prefetch()
}

// main>micro>loader>prefetch.js
import { getList } from '../const/subApps';
import { parseHtml } from './index';
export const prefetch = async () => {
  // 1. 获取到所有子应用列表 - 不包括当前正在显示的
  const list = getList().filter(item => !window.location.pathname.startsWith(item.activeRule))
  // 2. 预加载剩下的所有子应用
  await Promise.all(list.map(async item => await parseHtml(item.entry, item.name)))
}
```

## 自动部署和发布

首先部署一个可以进行发布子版本的网页
![发布请求](./%E5%8F%91%E5%B8%83.png)
在应用下新建一个文件夹 version 保存各个子应用的版本

在点击发布之后发送一个请求，直接在后台对子应用进行打包，生成对应版本文件夹，并在文件夹下放置子应用打包后的代码，之后直接把资源放进资源文件夹即可