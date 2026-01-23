import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { pinia } from './store'
import uviewPlus from 'uview-plus'

export function createApp() {
  const app = createSSRApp(App)

  // 使用 Pinia 状态管理
  app.use(pinia)

  // 使用 uView Plus UI 组件库
  app.use(uviewPlus)

  return {
    app
  }
}
// #endif
