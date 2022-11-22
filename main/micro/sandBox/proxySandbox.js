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
