import {isTurnChild} from '../utils'
import { lifecycle } from '../lifeCycle'

export const turnApp = async () => {
  // 判断是否切换了子应用
  if (isTurnChild()) {
    await lifecycle()
  }
}