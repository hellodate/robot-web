<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import SideMenu from './components/SideMenu.vue'
import TopBar from './components/TopBar.vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 主布局：左侧菜单栏 + 顶栏 + 内容区。
 *
 * 布局规格（对齐 Web 端原型 v2.0）：
 *  - 侧边栏：220px（折叠 64px），白底，菜单按业务分组
 *  - 顶栏：56px，含页面标题、节点状态、用户信息、操作入口
 *  - 内容区：自适应，灰色底（#F3F4F6）
 */
const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()

const sidebarWidth = computed(() => (appStore.sidebarCollapsed ? '64px' : '220px'))

const pageTitle = computed(() => (route.meta.title as string) ?? '')

onMounted(async () => {
  // 首次进入或刷新时同步用户信息（localStorage 可能过期或被篡改）
  if (authStore.isAuthenticated && !authStore.userInfo) {
    await authStore.fetchUserInfo()
  }
})
</script>

<template>
  <div class="layout-root">
    <!-- 左侧菜单栏 -->
    <aside class="layout-sidebar" :style="{ width: sidebarWidth }">
      <SideMenu :collapsed="appStore.sidebarCollapsed" />
    </aside>

    <!-- 右侧主区 -->
    <div class="layout-main">
      <TopBar :title="pageTitle" />

      <main class="layout-content">
        <router-view v-slot="{ Component, route: r }">
          <transition name="fade-slide" mode="out-in">
            <keep-alive :max="8">
              <component :is="Component" :key="r.path" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: $gray-100;
}

.layout-sidebar {
  flex-shrink: 0;
  height: 100%;
  background-color: #fff;
  border-right: 1px solid $gray-200;
  transition: width 0.2s ease;
  overflow: hidden;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // 防止内容溢出撑破 flex 容器
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  background-color: $gray-100;
}

// 页面切换动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
