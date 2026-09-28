import type { App } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 全局自定义指令。
 *
 * v-permission  按角色层级控制元素显示/移除
 *   <el-button v-permission="2">发布</el-button>          → 角色层级 ≥ 2 才渲染
 *   <el-button v-permission="'ADMIN'">删除</el-button>    → 仅管理员可见
 *
 * 与路由守卫的区别：路由守卫控制"页面能否进入"，指令控制"元素能否显示"。
 * 两者需配合使用（后端接口另有 @PreAuthorize 兜底，前端仅做体验优化，不作为安全边界）。
 */
export function setupDirectives(app: App): void {
  app.directive('permission', {
    mounted(el: HTMLElement, binding) {
      const authStore = useAuthStore()
      const value = binding.value

      if (value === undefined || value === null) return

      let allowed = false

      if (typeof value === 'number') {
        // 层级数值判定
        allowed = authStore.roleLevel >= value
      } else if (typeof value === 'string') {
        // 角色编码判定
        allowed = authStore.role === value
      } else if (Array.isArray(value)) {
        // 角色编码数组（满足其一即可）
        allowed = value.includes(authStore.role)
      }

      if (!allowed) {
        // 使用 remove 而非 display:none —— 避免通过 DOM 检查绕过权限
        el.parentNode?.removeChild(el)
      }
    },
  })

  /**
   * v-role  语义化角色判定（等价于 v-permission 传字符串数组）
   *   <div v-role="['ADMIN', 'TEST_ENGINEER']">…</div>
   */
  app.directive('role', {
    mounted(el: HTMLElement, binding) {
      const authStore = useAuthStore()
      const roles: string[] = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!roles.includes(authStore.role)) {
        el.parentNode?.removeChild(el)
      }
    },
  })
}
