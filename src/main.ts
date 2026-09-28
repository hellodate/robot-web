import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { setupDirectives } from './directives'

// 样式（顺序敏感：Element Plus 基础样式 → 项目设计系统 → UnoCSS）
import 'element-plus/dist/index.css'
import 'normalize.css/normalize.css'
import 'virtual:svg-icons-register'   // SVG 雪碧图
import '@/styles/index.scss'
import 'uno.css'

/**
 * 应用启动入口。
 *
 * 装配顺序：
 *  1. Pinia（状态管理）—— 必须在 router 之前，路由守卫依赖 store
 *  2. Router（含权限守卫）
 *  3. Element Plus（中文语言包）
 *  4. 全局指令（权限控制 v-permission）
 *  5. 图标组件全局注册
 */
const app = createApp(App)

// 1. 状态管理
const pinia = createPinia()
app.use(pinia)

// 2. 路由（守卫中会使用 store，故在 pinia 之后）
app.use(router)

// 3. UI 组件库
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default',
  zIndex: 3000,
})

// 4. 全局指令
setupDirectives(app)

// 5. 图标（Element Plus 图标全量注册，供 <el-icon><Xxx /></el-icon> 使用）
Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
  app.component(key, component)
})

// 6. 全局错误处理（避免单个组件异常导致白屏）
app.config.errorHandler = (err, instance, info) => {
  console.error('[全局异常]', err, info)
  // 生产环境可在此接入错误上报
}

app.mount('#app')
