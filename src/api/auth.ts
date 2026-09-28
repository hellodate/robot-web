import { http } from '@/utils/request'
import type { LoginRequest, LoginResponse, UserInfo, UserSaveRequest, UserQuery } from '@/types/api'

/**
 * 鉴权与用户管理接口。
 */
export const authApi = {
  /** 账号密码登录。 */
  login(payload: LoginRequest) {
    return http.post<LoginResponse>('/auth/login', payload)
  },

  /** 登出。 */
  logout() {
    return http.post<void>('/auth/logout')
  },

  /** 当前登录用户信息。 */
  me() {
    return http.get<UserInfo>('/auth/me')
  },

  /** PIN 码验证（启动测试、修改关键配置前的二次确认）。 */
  verifyPin(pin: string) {
    return http.post<boolean>('/auth/verify-pin', { pin }, { silent: true })
  },

  /** 修改密码。 */
  changePassword(oldPassword: string, newPassword: string) {
    return http.post<void>('/auth/change-password', { oldPassword, newPassword })
  },

  /** 在线用户列表（管理员）。 */
  onlineUsers() {
    return http.get<Array<{ account: string; clientIp?: string; clientId?: string; loginAt: string }>>('/auth/online')
  },
}

/**
 * 用户管理接口（管理员）。
 */
export const userApi = {
  /** 分页查询。 */
  page(query: UserQuery) {
    return http.page<UserInfo>('/users', query as Record<string, unknown>)
  },

  /** 新建用户。 */
  create(payload: UserSaveRequest) {
    return http.post<UserInfo>('/users', payload)
  },

  /** 编辑用户。 */
  update(id: number, payload: UserSaveRequest) {
    return http.put<UserInfo>(`/users/${id}`, payload)
  },

  /** 重置密码（返回新密码，仅本次可见）。 */
  resetPassword(id: number) {
    return http.post<string>(`/users/${id}/reset-password`)
  },

  /** 启用/停用。 */
  toggleEnabled(id: number, enabled: boolean) {
    return http.patch<UserInfo>(`/users/${id}/enabled`, null, { params: { enabled } })
  },

  /** 强制下线。 */
  kickOut(account: string) {
    return http.delete<void>(`/users/${account}/online`)
  },
}
