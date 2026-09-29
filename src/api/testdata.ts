import { http } from '@/utils/request'
import type {
  AnalysisData,
  AuditLog,
  AuditQuery,
  Defect,
  Device,
  PageQuery,
  RecordQuery,
  TestRecord,
  TestRecordDetail,
  TraceData,
} from '@/types/api'

/**
 * 测试记录接口。
 */
export const recordApi = {
  /** 分页查询记录。 */
  page(query: RecordQuery) {
    return http.page<TestRecord>('/records', query as Record<string, unknown>)
  },

  /** 记录详情（含操作流水/缺陷）。 */
  detail(id: number) {
    return http.get<TestRecordDetail>(`/records/${id}`)
  },

  /** 最近测试记录（工作台）。 */
  recent(limit = 5) {
    return http.get<TestRecord[]>('/records/recent', { limit })
  },

  /** 上报测试记录（PC 端调用）。 */
  upload(payload: Record<string, unknown>, nodeCode?: string) {
    return http.post<TestRecord>('/records/upload', payload, { params: { nodeCode } })
  },
}

/**
 * 缺陷接口。
 */
export const defectApi = {
  /** 分页查询。 */
  page(query: PageQuery & { status?: string; level?: string; keyword?: string }) {
    return http.page<Defect>('/defects', query as Record<string, unknown>)
  },

  /** 登记缺陷。 */
  create(payload: { deviceSn: string; recordId?: number; defectType?: string; description: string; level: string }) {
    return http.post<Defect>('/defects', payload)
  },

  /** 状态流转。 */
  updateStatus(id: number, status: string, handleNote?: string) {
    return http.patch<Defect>(`/defects/${id}/status`, { status, handleNote })
  },
}

/**
 * 设备台账接口。
 */
export const deviceApi = {
  /** 分页查询。 */
  page(query: PageQuery & { keyword?: string; status?: string }) {
    return http.page<Device>('/devices', query as Record<string, unknown>)
  },

  /** 新增设备。 */
  create(payload: Record<string, unknown>) {
    return http.post<Device>('/devices', payload)
  },

  /** 更新设备。 */
  update(id: number, payload: Record<string, unknown>) {
    return http.put<Device>(`/devices/${id}`, payload)
  },

  /** 更新状态。 */
  updateStatus(id: number, status: string) {
    return http.patch<Device>(`/devices/${id}/status`, null, { params: { status } })
  },
}

/**
 * 分析引擎接口。
 */
export const analysisApi = {
  /** 分析全量数据（概览 + 趋势 + 分布）。 */
  analyze(params: { range?: string; from?: string; to?: string; scenarioCode?: string }) {
    return http.get<AnalysisData>('/analysis', params as Record<string, unknown>)
  },
}

/**
 * 追溯系统接口。
 */
export const traceApi = {
  /** SN 全链路追溯。 */
  trace(deviceSn: string) {
    return http.get<TraceData>(`/trace/${deviceSn}`, undefined, { silent: true })
  },
}

/**
 * 审计日志接口（管理员）。
 */
export const auditApi = {
  /** 分页查询。 */
  page(query: AuditQuery) {
    return http.page<AuditLog>('/audit', query as Record<string, unknown>)
  },
}
