<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

/**
 * 应用根组件。
 *
 * 职责：
 *  1. 提供 Element Plus 中文语言环境
 *  2. 全局主题配置（size / zIndex 统一在此控制）
 *  3. 页面可见性监听（用于 PC 端空闲锁定/数据刷新节流，此处预留给 Web 端）
 */
let visibilityHandler: (() => void) | null = null

onMounted(() => {
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      // 页面重新可见时触发（可用于刷新数据，避免后台标签页消耗资源）
      window.dispatchEvent(new CustomEvent('app:visible'))
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
})

onUnmounted(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
})
</script>

<template>
  <el-config-provider :locale="zhCn" :z-index="3000" size="default">
    <router-view />
  </el-config-provider>
</template>

<style scoped>
/* 根组件无额外样式，布局由路由页面承担 */
</style>
