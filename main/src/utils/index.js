import {registerMicroApps, start} from '../../micro/index'
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