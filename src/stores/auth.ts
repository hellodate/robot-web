import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getStorage, setStorage, removeStorage } from '@/utils/storage'
import { authApi } from '@/api/auth'
import type { UserInfo, LoginRequest } from '@/types/api'
import router from '@/router'

/**
 * 认证状态管理。
 *
 * 状态持久化策略：
 *  - accessToken → Cookie（由 utils/storage 管理）
 *  - userInfo   → localStorage（刷新页面后免二次请求，接口失败时以服务端为准）
 */
export const useAuthStore = defineStore('auth', () => {
  // ══════════════════════ 状态 ══════════════════════

  const token = ref<string>(getToken())
  const userInfo = ref<UserInfo | null>(getStorage<UserInfo | null>('userInfo', null))
  const loading = ref(false)

  // ══════════════════════ 派生状态 ══════════════════════

  /** 是否已登录。 */
  const isAuthenticated = computed(() => !!token.value)

  /** 当前角色编码。 */
  const role = computed(() => userInfo.value?.role ?? 'GUEST')

  /** 当前角色层级（0~4）。 */
  const roleLevel = computed(() => userInfo.value?.roleLevel ?? 0)

  /** 是否为管理员。 */
  const isAdmin = computed(() => roleLevel.value >= 4)

  /** 是否具备指定层级。 */
  function hasLevel(required: number): boolean {
    return roleLevel.value >= required
  }

  /** 显示名（账号 + 角色）。 */
  const displayName = computed(() => {
    const u = userInfo.value
    return u ? `${u.name}（${u.roleName}）` : '未登录'
  })

  // ══════════════════════ 操作 ══════════════════════

  /** 登录。 */
  async function login(payload: LoginRequest): Promise<void> {
    loading.value = true
    try {
      const res = await authApi.login(payload)
      token.value = res.accessToken
      setToken(res.accessToken, res.expiresIn)

      userInfo.value = res.user
      setStorage('userInfo', res.user)
    } finally {
      loading.value = false
    }
  }

  /** 登出（清理本地状态并跳转登录页）。 */
  async function logout(redirect = true): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // 服务端登出失败不阻塞本地清理
    } finally {
      clearAuth()
      if (redirect) {
        await router.push('/login')
      }
    }
  }

  /** 清理认证状态。 */
  function clearAuth(): void {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeStorage('userInfo')
  }

  /** 拉取当前用户信息（刷新页面或权限变更后同步服务端）。 */
  async function fetchUserInfo(): Promise<UserInfo | null> {
    try {
      const user = await authApi.me()
      userInfo.value = user
      setStorage('userInfo', user)
      return user
    } catch {
      clearAuth()
      return null
    }
  }

  /** PIN 码验证（启动测试、修改关键配置前）。 */
  async function verifyPin(pin: string): Promise<boolean> {
    return authApi.verifyPin(pin)
  }

  return {
    // 状态
    token,
    userInfo,
    loading,
    // 派生
    isAuthenticated,
    role,
    roleLevel,
    isAdmin,
    displayName,
    hasLevel,
    // 操作
    login,
    logout,
    clearAuth,
    fetchUserInfo,
    verifyPin,
  }
})
