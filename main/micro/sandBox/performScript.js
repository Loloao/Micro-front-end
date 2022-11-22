export const performScriptForEval = (script, appName, global) => {
  window.proxy = global
  // 之前配置的library可以获取window.appName有生命周期函数
  const scriptText = `
    ((window) => {
      ${script}
      return window['${appName}'] 
    })(window.proxy)
  `
  return eval(scriptText)// app module mount
}
export const performScriptForFunction = (script, appName, global) => {
  window.proxy = global
  const scriptText = `
  ((window) => {
    ${script}
    return window['${appName}']
  })(window.proxy)
  `
  return new Function(scriptText)
}