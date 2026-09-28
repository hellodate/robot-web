import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

/**
 * 应用界面状态管理。
 *
 * 管理跨页面共享的界面状态：侧边栏折叠、面包屑、全局 loading、页面标签。
 * 与业务无关的状态一律放此处，保持 auth store 职责单一。
 */
export const useAppStore = defineStore('app', () => {
  /** 侧边栏是否折叠（持久化，刷新后保持用户偏好）。 */
  const sidebarCollapsed = ref<boolean>(getStorage('sidebarCollapsed', false))

  /** 全局 loading 计数（并发请求时避免闪烁）。 */
  const loadingCount = ref(0)

  /** 当前页面标题（供顶栏显示）。 */
  const pageTitle = ref('')

  /** 切换侧边栏折叠状态。 */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    setStorage('sidebarCollapsed', sidebarCollapsed.value)
  }

  /** 设置侧边栏折叠状态。 */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed
    setStorage('sidebarCollapsed', collapsed)
  }

  /** 开始全局 loading。 */
  function startLoading(): void {
    loadingCount.value++
  }

  /** 结束全局 loading。 */
  function endLoading(): void {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  /** 是否处于全局 loading。 */
  function isLoading(): boolean {
    return loadingCount.value > 0
  }

  /** 设置页面标题。 */
  function setPageTitle(title: string): void {
    pageTitle.value = title
  }

  return {
    sidebarCollapsed,
    loadingCount,
    pageTitle,
    toggleSidebar,
    setSidebarCollapsed,
    startLoading,
    endLoading,
    isLoading,
    setPageTitle,
  }
})
