import { fetchResource } from "../utils/fetchResource"
import { sandBox } from "../sandBox";
// 加载 html 的方法
export const loadHtml = async (app) => {
  // 第一，子应用需要显示在哪里
  let container = app.container
  // 子应用入口
  let entry = app.entry

  const [dom, scripts] = await parseHtml(entry)

  const ct = document.querySelector(container)
  ct.innerHTML = dom

  scripts.forEach(v => {
    sandBox(app, v)
  })

  return app
}

export const parseHtml = async (entry) => {
  const html = await fetchResource(entry)

  let allScript = []
  const div = document.createElement('div')
  div.innerHTML = html

  // 标签、link、script
  const [dom, scriptUrl, script] = await getResources(div, entry)

  const fetchedScript = await Promise.all(scriptUrl.map(async item => fetchResource(item)))

  allScript = script.concat(fetchedScript)
  
  return [dom, allScript]
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