// main > micro > sandbox > snapShotSandbox.js
// 快照沙箱：针对于给当前的全局变量实现一个快照的方式来记录我们沙箱的内容，
// 在子应用切换后将所有沙箱的变量设为初始值
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