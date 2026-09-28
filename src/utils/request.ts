import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken, clearStorage } from './storage'
import type { ApiResponse, PageMeta } from '@/types/api'

/**
 * HTTP 客户端封装。
 *
 * 设计约定（与后端统一响应结构对齐）：
 *  - 后端返回 { code, message, data, page }，code=0 表示业务成功
 *  - HTTP 401 → 清除登录态并跳转登录页（不重复弹窗）
 *  - HTTP 403 → 提示无权限
 *  - 业务失败（code != 0）→ 统一 ElMessage 提示，Promise reject 供调用方自行处理
 *  - 支持 `silent` 选项抑制自动提示（用于轮询、预检等场景）
 */

/** 扩展请求配置项。 */
export interface RequestOptions extends AxiosRequestConfig {
  /** 静默模式：不自动弹出错误提示 */
  silent?: boolean
  /** 返回完整响应体（含 page 分页信息），默认只返回 data */
  returnFullResponse?: boolean
  /** 跳过全局 loading 计数（用于高频请求） */
  skipLoading?: boolean
}

/** 后端统一响应结构（与 com.tnp.server.autotest.common.response.ApiResponse 对应）。 */
interface BackendResponse<T = unknown> {
  code: number
  message: string
  data?: T
  page?: PageMeta
}

const SUCCESS_CODE = 0

/** 401 处理去重标记（避免并发请求同时弹窗）。 */
let unauthorizedHandling = false

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

// ── 请求拦截：注入令牌 ──
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── 响应拦截：统一处理业务码与错误 ──
service.interceptors.response.use(
  (response: AxiosResponse<BackendResponse>) => {
    const options = response.config as RequestOptions
    const body = response.data

    // 非标准响应（如文件流）直接返回
    if (body == null || typeof body !== 'object' || !('code' in body)) {
      return response.data as never
    }

    // 业务成功
    if (body.code === SUCCESS_CODE) {
      return options.returnFullResponse ? (body as never) : (body.data as never)
    }

    // 业务失败
    if (!options.silent) {
      ElMessage.error(body.message || '操作失败')
    }
    return Promise.reject(Object.assign(new Error(body.message), { code: body.code, data: body }))
  },

  (error) => {
    const options = (error.config ?? {}) as RequestOptions
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      handleUnauthorized()
      return Promise.reject(error)
    }

    if (status === 403) {
      if (!options.silent) ElMessage.error('权限不足，无法执行该操作')
      return Promise.reject(error)
    }

    if (!options.silent) {
      const text =
        message ||
        (status === 404
          ? '请求的资源不存在'
          : status === 500
            ? '服务器内部错误'
            : error.code === 'ECONNABORTED'
              ? '请求超时，请检查网络'
              : '网络异常，请稍后重试')
      ElMessage.error(text)
    }

    return Promise.reject(error)
  },
)

/** 处理登录失效：提示后跳转登录页（去重，避免并发重复弹窗）。 */
function handleUnauthorized(): void {
  if (unauthorizedHandling) return
  unauthorizedHandling = true

  removeToken()
  clearStorage()

  ElMessageBox.confirm('登录状态已失效，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?redirect=${redirect}`
    })
    .catch(() => {
      // 用户取消则停留在当前页（后续请求仍会提示）
    })
    .finally(() => {
      unauthorizedHandling = false
    })
}

// ══════════════════════ 对外方法 ══════════════════════

export const http = {
  get<T = unknown>(url: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return service.get(url, { params, ...options }) as unknown as Promise<T>
  },

  post<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return service.post(url, data, options) as unknown as Promise<T>
  },

  put<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return service.put(url, data, options) as unknown as Promise<T>
  },

  patch<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return service.patch(url, data, options) as unknown as Promise<T>
  },

  delete<T = unknown>(url: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return service.delete(url, { params, ...options }) as unknown as Promise<T>
  },

  /**
   * 分页查询：返回 { list, page }。
   * 后端列表接口统一返回 data（数组）+ page（分页元信息）。
   */
  page<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<{ list: T[]; page: PageMeta }> {
    return service
      .get(url, { params, ...options, returnFullResponse: true } as RequestOptions)
      .then((body: unknown) => {
        const b = body as unknown as ApiResponse<T[]>
        return {
          list: (b.data ?? []) as T[],
          page: b.page ?? { page: 1, size: 20, total: 0, totalPages: 0 },
        }
      })
  },

  /** 文件下载（二进制流）。 */
  download(url: string, params?: Record<string, unknown>, filename?: string): Promise<void> {
    return service
      .get(url, { params, responseType: 'blob' })
      .then((blob: unknown) => {
        const b = blob as unknown as Blob
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(new Blob([b]))
        link.download = filename ?? `export_${Date.now()}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(link.href)
      })
  },
}

export default service
