import Cookies from 'js-cookie'

/**
 * 本地存储封装。
 *
 * 策略：
 *  - Token 存 Cookie（可设置过期时间，随请求自动携带的扩展空间）
 *  - 其他状态存 localStorage（如用户信息、界面偏好）
 *  - 统一前缀，避免与同域其他应用冲突
 */

const PREFIX = 'autotest_'

// ══════════════════════ Token（Cookie）══════════════════════

const TOKEN_KEY = 'access_token'

export function getToken(): string {
  return Cookies.get(TOKEN_KEY) ?? ''
}

/**
 * 保存令牌。
 * @param token 访问令牌
 * @param expiresInSeconds 有效期（秒），0 表示会话级
 */
export function setToken(token: string, expiresInSeconds = 0): void {
  const options: Cookies.CookieAttributes = { path: '/' }
  if (expiresInSeconds > 0) {
    options.expires = expiresInSeconds / 86400 // js-cookie 以「天」为单位
  }
  Cookies.set(TOKEN_KEY, token, options)
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY, { path: '/' })
}

// ══════════════════════ 本地存储（localStorage）══════════════════════

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.warn('[storage] 写入失败:', key, e)
  }
}

export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export function clearStorage(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}

// ══════════════════════ 会话级存储（sessionStorage）══════════════════════

export function getSession<T>(key: string, defaultValue: T): T {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.warn('[session] 写入失败:', key, e)
  }
}
